import { useEffect, useRef, useState } from 'react';
import './App.scss';

export const App = () => {
  const [history, setHistory] = useState(null);
  const [currentWaterTemp, setCurrentWaterTemp] = useState(null);
  const [currentAmbientTemp, setCurrentAmbientTemp] = useState(null);
  const [currentBatteryVoltage, setCurrentBatteryVoltage] = useState(null);

  const intervalIdRef = useRef();

  const fetchData = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const start = startDate.toISOString();

    const url = `https://api.nrfcloud.com/v1/messages?start=${start}&deviceId=nrf-350457790038614`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer e1b5f969259865cb4d08d819e7b12453320e616a'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    const items = result.items
      .filter(item => item.message.ambient && item.message.battery && item.message.water)
      .map(item => {
        const itemDate = new Date(item.message.ts);

        const date = itemDate.toLocaleDateString();
        const time = itemDate.toLocaleTimeString();
        
        return {
          ...item.message,
          date,
          time
        };
      })
      .sort((a, b) => a.ts > b.ts ? 0 : 1);
    
    setHistory(items);
    setCurrentWaterTemp(items[0]?.water);
    setCurrentAmbientTemp(items[0]?.ambient);
    setCurrentBatteryVoltage(items[0]?.battery);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const changeInterval = async (seconds) => {
    const url = "https://api.nrfcloud.com/v1/devices/nrf-350457790038614/state";
    const patchData = {
      desired: {
          config: {
              activeWaitTime: parseInt(seconds)
          }
      }
    };
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer e1b5f969259865cb4d08d819e7b12453320e616a'
      },
      body: JSON.stringify(patchData)
    });
  }

  const startInterval = (seconds) => {
    intervalIdRef.current = setInterval(fetchData, seconds * 1000);
  }

  const onIntervalClick = async (seconds) => {
    clearInterval(intervalIdRef.current);
    startInterval(seconds);
    changeInterval(seconds);
  }

  return (
    <section className='Indicators'>
      <div className="dashboard_inner">
        <div className="dashboard_box">
          <div className="circle_text_box">
          <span>{currentWaterTemp ?? '?'}</span>
          </div>
          <h3>Water temparature</h3>
        </div>
      
        <div className="dashboard_box">
          <div className="circle_text_box">
          <span>{currentAmbientTemp ?? '?'}</span>
          </div>
          <h3>Ambient Temparature</h3>
        </div>
      
        <div className="dashboard_box">
          <div className="circle_text_box">
          <span>{currentBatteryVoltage ?? '?'}</span>
          </div>
          <h3>Battery Voltage</h3>
        </div>
      </div>
      <div className="table"> 
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Water Temp</th>
                <th>Ambient Temp</th>
                <th>Battery Voltage</th>
              </tr>
            </thead>
            <tbody>
              {history?.map(item => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                  <td>{item.water}</td>
                  <td>{item.ambient}</td>
                  <td>{item.battery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
          
      <div className="button-container">
        <button className="button button-fast" onClick={() => onIntervalClick(5)}>Fast</button>
        <button className="button button-slow" onClick={() => onIntervalClick(600)}>Slow</button>
      </div>
    </section>)
};
