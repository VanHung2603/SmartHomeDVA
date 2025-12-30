import { useEffect, useState } from "react";
import "./App.css";
import { db } from "./firebase";
import { ref, onValue, update } from "firebase/database";

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className="value">{value ?? "-"}</span>
    </div>
  );
}

function Badge({ text }) {
  return <span className="badge">{text}</span>;
}

function Btn({ onClick, children }) {
  return (
    <button className="btn" onClick={onClick}>
      {children}
    </button>
  );
}

// optional: format ts nếu bạn dùng millis/seconds demo
const fmtTs = (ts) => {
  if (ts == null) return "-";
  return String(ts);
};

export default function App() {
  const [devices, setDevices] = useState({});
  const [rfidLatest, setRfidLatest] = useState(null);
  const [rfidLogs, setRfidLogs] = useState([]);

  useEffect(() => {
    // 1) smarthome devices
    const unsubDevices = onValue(ref(db, "devices"), (snap) => {
      setDevices(snap.val() || {});
    });

    // 2) rfid latest
    const unsubRfidLatest = onValue(ref(db, "rfid/latest"), (snap) => {
      setRfidLatest(snap.val());
    });

    // 3) rfid logs
    const unsubRfidLogs = onValue(ref(db, "rfid/logs"), (snap) => {
      const val = snap.val();
      if (!val) return setRfidLogs([]);
      const arr = Object.entries(val).map(([key, item]) => ({ key, ...item }));
      arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      setRfidLogs(arr.slice(0, 10));
    });

    return () => {
      unsubDevices();
      unsubRfidLatest();
      unsubRfidLogs();
    };
  }, []);

  const d8266 = devices?.esp8266 || {};
  const d32 = devices?.esp32 || {};

  // helper gửi lệnh
  const sendCmd = async (path, payload) => {
    // path ví dụ: "esp8266/fire" => cmd/esp8266/fire
    await update(ref(db, `cmd/${path}`), payload);
  };

  return (
    <div className="page">
      <div className="grid">
        <div className="header">
          <h1 style={{ margin: 0 }}>Smarthome from Duong Van An School</h1>
          {/* <div className="small">Theo dõi & điều khiển ESP8266 / ESP32 (Realtime)</div> */}
        </div>

        <Card title="🚪 Cửa chính (RFID)">
          <Row label="Trạng thái" value={d32?.main_door?.state} />

          <div style={{ marginTop: 12, fontWeight: 800 }}>RFID</div>
          <Row label="UID mới nhất" value={rfidLatest?.uid} />
          <Row label="Thời gian" value={fmtTs(rfidLatest?.ts)} />

          <div className="small">
            {rfidLatest?.uid ? <Badge text="Đã quẹt thẻ" /> : <Badge text="Chưa có thẻ" />}
          </div>

          <div className="btnBar">
            <Btn onClick={() => sendCmd("esp32/main_door", { cmd: "open", id: String(Date.now()) })}>
              Open
            </Btn>
            <Btn onClick={() => sendCmd("esp32/main_door", { cmd: "close", id: String(Date.now()) })}>
              Close
            </Btn>
          </div>

          <div style={{ marginTop: 12, fontWeight: 800 }}>Logs gần nhất</div>
          <ul className="logs">
            {rfidLogs.map((x) => (
              <li key={x.key}>
                <b>{x.uid}</b> — {fmtTs(x.ts)}
              </li>
            ))}
          </ul>

          <div className="small">Cmd → /cmd/esp32/main_door</div>
        </Card>


        {/* Báo cháy */}
        <Card title="🔥 Báo cháy (ESP8266)">
          <Row label="Gas (MQ-2)" value={d8266?.fire?.gas_ppm} />
          <Row label="Nhiệt độ (DHT22)" value={d8266?.fire?.temp_c != null ? `${d8266.fire.temp_c} °C` : null} />
          <Row label="Độ ẩm (DHT22)" value={d8266?.fire?.humi != null ? `${d8266.fire.humi} %` : null} />
          <Row label="Alarm" value={d8266?.fire?.alarm ? "ON" : "OFF"} />
          {/* <Row label="Relay" value={d8266?.fire?.relay ? "ON" : "OFF"} /> */}

          <div className="btnBar">
            <Btn onClick={() => sendCmd("esp8266/fire", { relay: true })}>Relay ON</Btn>
            <Btn onClick={() => sendCmd("esp8266/fire", { relay: false })}>Relay OFF</Btn>
            <Btn onClick={() => sendCmd("esp8266/fire", { buzzer: true })}>Buzzer</Btn>
          </div>
          <div className="small">Cmd → /cmd/esp8266/fire</div>
        </Card>

        {/* LED tự động */}
        <Card title="💡 Đèn thông minh (ESP8266)">
  <Row label="Mode" value={d8266?.lighting?.mode} />
  <Row label="LED" value={d8266?.lighting?.state ? "ON" : "OFF"} />

  <div className="btnBar">
    <Btn onClick={() => sendCmd("esp8266/lighting", { mode: "auto", onHour: 19, offHour: 22 })}>
      Auto
    </Btn>
    <Btn onClick={() => sendCmd("esp8266/lighting", { mode: "manual" })}>
      Manual
    </Btn>
    <Btn onClick={() => sendCmd("esp8266/lighting", { mode: "manual", state: true })}>
      LED ON
    </Btn>
    <Btn onClick={() => sendCmd("esp8266/lighting", { mode: "manual", state: false })}>
      LED OFF
    </Btn>
  </div>

  <div className="small">Cmd → /cmd/esp8266/lighting</div>
</Card>


        {/* Thu quần áo */}
        <Card title="👕 Thu quần áo (ESP32)">
          <Row label="Mưa" value={d32?.clothes?.isRaining ? "ĐANG MƯA" : "KHÔNG MƯA"} />
          {/* <Row label="Lux" value={d32?.clothes?.lux} /> */}
          <Row label="Vị trí (servo %)" value={d32?.clothes?.linePos != null ? `${d32.clothes.linePos}%` : null} />
          <Row label="Mode" value={d32?.clothes?.mode} />

          <div className="btnBar">
            <Btn onClick={() => sendCmd("esp32/clothes", { mode: "auto" })}>Auto</Btn>
            <Btn onClick={() => sendCmd("esp32/clothes", { mode: "manual" })}>Manual</Btn>
            <Btn onClick={() => sendCmd("esp32/clothes", { moveTo: 0 })}>Thu vào (0%)</Btn>
            <Btn onClick={() => sendCmd("esp32/clothes", { moveTo: 100 })}>Đẩy ra (100%)</Btn>
          </div>
          <div className="small">Cmd → /cmd/esp32/clothes</div>
        </Card>

        <Card title="🚪 Cửa trong nhà (PIR)">
          {/* <Row label="PIR Motion" value={d32?.door2?.motion ? "CÓ NGƯỜI" : "KHÔNG"} /> */}
          <Row label="Trạng thái" value={d32?.door2?.state} />
          <Row label="Mode" value={d32?.door2?.mode} />


          <div className="btnBar">
            <Btn onClick={() => sendCmd("esp32/inner_door", { mode: "auto", id: String(Date.now()) })}>
            Auto
          </Btn>
          <Btn onClick={() => sendCmd("esp32/inner_door", { mode: "manual", id: String(Date.now()) })}>
            Manual
          </Btn>
            <Btn onClick={() => sendCmd("esp32/inner_door", { cmd: "open", id: String(Date.now()) })}>
            Open
          </Btn>
          <Btn onClick={() => sendCmd("esp32/inner_door", { cmd: "close", id: String(Date.now()) })}>
            Close
          </Btn>
          </div>

  <div className="small">Cmd → /cmd/esp32/inner_door</div>
</Card>


        {/* Thang máy */}
<Card title="🛗 Thang máy (ESP32)">
  <Row label="Tầng hiện tại" value={d32?.elevator?.currentFloor} />
  <Row label="Tầng đích" value={d32?.elevator?.targetFloor} />
  <Row label="Nguồn lệnh" value={d32?.elevator?.lastSource} />
  <Row label="Step vị trí" value={d32?.elevator?.posSteps} />
  <Row label="UpdatedAt" value={fmtTs(d32?.elevator?.updatedAt)} />

  <div className="btnBar">
    <Btn
      onClick={() =>
        sendCmd("esp32/elevator", { id: String(Date.now()), floor: 0 })
      }
    >
      Tầng 1
    </Btn>

    <Btn
      onClick={() =>
        sendCmd("esp32/elevator", { id: String(Date.now()), floor: 1 })
      }
    >
      Tầng 2
    </Btn>
  </div>

  <div className="small">Cmd → /cmd/esp32/elevator (id + floor: 0|1)</div>
</Card>

      </div>
    </div>
  );
}
