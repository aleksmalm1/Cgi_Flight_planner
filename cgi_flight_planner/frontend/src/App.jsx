import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function App() {
  const [date, setDate] = useState(new Date());
  const [sortKey, setSortKey] = useState('time');
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxDuration, setMaxDuration] = useState(360);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatPreferences, setSeatPreferences] = useState({
    together: false,
    window: false,
    legroom: false
  });
  const bigLegroomSeats = ['1A','1B','1C','1D','1E','1F'];
  const [seatMapAvailability, setSeatMapAvailability] = useState({});

  const formatDateForApi = (d) => d.toISOString().split('T')[0];
  const formatDate = (d) => d.toLocaleDateString('et-EE');

  const durationToMinutes = (duration) => {
    const hourMatch = duration.match(/(\d+)h/);
    const minuteMatch = duration.match(/(\d+)m/);
    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
    return hours * 60 + minutes;
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const calculateArrivalTime = (departureTime, duration) => {
    const [depH, depM] = departureTime.split(':').map(num => parseInt(num, 10));
    const dMins = durationToMinutes(duration);
    let total = depH * 60 + depM + dMins;
    const days = Math.floor(total / (24 * 60));
    total = total % (24 * 60);
    const arrH = Math.floor(total / 60);
    const arrM = total % 60;
    const result = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;
    return days > 0 ? `${result} (+${days})` : result;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const apiUrl = `http://localhost:8080/api/flights?date=${formatDateForApi(date)}`;
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setFlights(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(error => {
        setError(`Viga lendude laadimisel: ${error.message}`);
        setLoading(false);
      });
  }, [date]);

  const destinations = React.useMemo(() => {
    if (!flights.length) return [];
    const unique = new Set(flights.map(f => f.to));
    return [...unique].sort();
  }, [flights]);

  const filteredAndSortedFlights = React.useMemo(() => {
    let result = flights;
    result = result.filter(f => durationToMinutes(f.duration) <= maxDuration);
    if (selectedCountries.length > 0) {
      result = result.filter(f => selectedCountries.includes(f.to));
    }
    return result.sort((a, b) => {
      if (sortKey === 'time') return a.time.localeCompare(b.time);
      if (sortKey === 'priceAsc') return a.price - b.price;
      if (sortKey === 'priceDesc') return b.price - a.price;
      if (sortKey === 'durationAsc') {
        return durationToMinutes(a.duration) - durationToMinutes(b.duration);
      }
      if (sortKey === 'durationDesc') {
        return durationToMinutes(b.duration) - durationToMinutes(a.duration);
      }
      return 0;
    });
  }, [flights, sortKey, maxDuration, selectedCountries]);

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setSelectedCountries(prev => 
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setShowSeatMap(false);
    setSelectedSeats([]);
    setTicketCount(1);
    setSeatPreferences({ together: false, window: false, legroom: false });
  };

  const handleConfirmBooking = () => {
    setShowSeatMap(true);
    const newAvailability = {};
    for (let row = 1; row <= 15; row++) {
      for (let col = 0; col < 6; col++) {
        const letter = String.fromCharCode(65 + col);
        const seatId = row + letter;
        newAvailability[seatId] = Math.random() > 0.3;
      }
    }
    setSeatMapAvailability(newAvailability);
  };

  const handleSeatSelect = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < ticketCount) {
        setSelectedSeats(prev => [...prev, seatId]);
      }
    }
  };

  const handleBookingComplete = () => {
    const bigSeatsChosen = selectedSeats.filter(s => bigLegroomSeats.includes(s)).length;
    const totalPrice = (selectedFlight.price * ticketCount) + (15 * bigSeatsChosen);
    alert(
      `Broneeritud!\n` +
      `Lend: ${selectedFlight.from} → ${selectedFlight.to}\n` +
      `Kuupäev: ${formatDate(date)}\n` +
      `Istekohad: ${selectedSeats.join(', ')}\n` +
      `Eelistused: ${JSON.stringify(seatPreferences)}\n\n` +
      `Kokku: €${totalPrice}`
    );
    setSelectedFlight(null);
    setShowSeatMap(false);
    setSelectedSeats([]);
  };

  function isWindowSeat(seatId) {
    const letter = seatId.slice(-1);
    return (letter === 'A' || letter === 'F');
  }

  function isSeatRecommended(seatId) {
    if (!seatMapAvailability[seatId]) return false;
    if (seatPreferences.legroom) {
      const rowPart = seatId.replace(/\D/g, '');
      if (rowPart !== '1') return false;
    }
    if (seatPreferences.window) {
      if (!isWindowSeat(seatId)) return false;
    }
    if (seatPreferences.together && ticketCount === 2) {
      const row = seatId.replace(/\D/g, '');
      const letter = seatId.slice(-1);
      const code = letter.charCodeAt(0);
      const leftSeatId = row + String.fromCharCode(code - 1);
      const rightSeatId = row + String.fromCharCode(code + 1);
      let leftOk = false, rightOk = false;
      if (code > 65) {
        leftOk = seatMapAvailability[leftSeatId] === true;
      }
      if (code < 70) {
        rightOk = seatMapAvailability[rightSeatId] === true;
      }
      if (!leftOk && !rightOk) return false;
    }
    return true;
  }

  const SeatMap = () => {
    const rows = 15;
    const colsLeft = 3;
    const colsRight = 3;
    const bigSeatsChosen = selectedSeats.filter(s => bigLegroomSeats.includes(s)).length;
    const totalPrice = (selectedFlight.price * ticketCount) + (15 * bigSeatsChosen);
    const seats = [];

    function renderSeat(seatId) {
      const available = seatMapAvailability[seatId] ?? false;
      const isSelected = selectedSeats.includes(seatId);
      const recommended = isSeatRecommended(seatId);
      let bg = '#aaa';
      if (available) bg = 'white';
      if (recommended) bg = '#d0f0c0';
      if (bigLegroomSeats.includes(seatId) && available && !recommended) {}
      if (isSelected) bg = '#4CAF50';
      return (
        <div
          key={seatId}
          style={{
            width: '35px',
            height: '35px',
            margin: '3px',
            backgroundColor: bg,
            border: '1px solid #999',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '4px',
            cursor: available ? 'pointer' : 'not-allowed',
            color: isSelected ? 'white' : 'black',
            fontWeight: 'bold'
          }}
          onClick={() => {
            if (available || isSelected) {
              handleSeatSelect(seatId);
            }
          }}
        >
          {seatId}
        </div>
      );
    }

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < colsLeft; col++) {
        const seatLetter = String.fromCharCode(65 + col);
        const seatId = `${row}${seatLetter}`;
        rowSeats.push(renderSeat(seatId));
      }
      rowSeats.push(<div key={`aisle-${row}`} style={{ width: '20px' }}></div>);
      for (let col = 0; col < colsRight; col++) {
        const seatLetter = String.fromCharCode(68 + col);
        const seatId = `${row}${seatLetter}`;
        rowSeats.push(renderSeat(seatId));
      }
      seats.push(
        <div key={`row-${row}`} style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '25px',
            height: '35px',
            margin: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {row}
          </div>
          {rowSeats}
        </div>
      );
    }

    const rowLabels = (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
        <div style={{ width: '25px' }}></div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>A</div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>B</div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>C</div>
        <div style={{ width: '20px' }}></div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>D</div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>E</div>
        <div style={{ width: '35px', margin: '3px', textAlign: 'center' }}>F</div>
      </div>
    );

    return (
      <div style={{ padding: '20px', backgroundColor: '#f8f8f8', borderRadius: '8px' }}>
        <h3>Vali istekohad</h3>
        <p>Vali {ticketCount} kohta:</p>
        <p>Valitud: {selectedSeats.join(', ')} ({selectedSeats.length}/{ticketCount})</p>
        <p><strong>Hind hetkel:</strong> 
          {' '}€{selectedFlight.price} × {ticketCount} 
          {' '}+ €15 × {bigSeatsChosen} (legroom) = 
          {' '}<strong>€{totalPrice}</strong>
        </p>
        <div style={{ margin: '20px 0', backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
          <div style={{ width: '100px', height: '50px', margin: '0 auto 20px', borderRadius: '50% 50% 0 0', backgroundColor: '#ddd' }}></div>
          {rowLabels}
          {seats}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: 'white', border: '1px solid #999', marginRight: '5px', borderRadius: '3px' }}></div>
              <span>Vaba (tavaline)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: '#d0f0c0', marginRight: '5px', border: '1px solid #999', borderRadius: '3px' }}></div>
              <span>Soovitatud eelistustel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: '#4CAF50', marginRight: '5px', borderRadius: '3px' }}></div>
              <span>Valitud</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: '#aaa', marginRight: '5px', borderRadius: '3px' }}></div>
              <span>Broneeritud</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleBookingComplete}
            disabled={selectedSeats.length !== ticketCount}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedSeats.length === ticketCount ? '#4CAF50' : '#ddd',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: selectedSeats.length === ticketCount ? 'pointer' : 'not-allowed',
              fontSize: '16px'
            }}
          >
            Kinnita broneering
          </button>
          <button 
            onClick={() => setShowSeatMap(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              marginLeft: '10px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Tagasi
          </button>
        </div>
      </div>
    );
  };

  const BookingDetails = () => {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        overflow: 'auto'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {showSeatMap ? (
            <SeatMap />
          ) : (
            <>
              <h2>Broneeri lend</h2>
              <div style={{ 
                padding: '15px', 
                border: '1px solid #ddd',
                borderRadius: '8px',
                margin: '15px 0',
                backgroundColor: '#f8f8f8'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
                  ✈️ {selectedFlight.from} → {selectedFlight.to}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '5px',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div>
                    <div><strong>Kuupäev:</strong> {formatDate(date)}</div>
                    <div><strong>Väljub:</strong> {selectedFlight.time}</div>
                    <div><strong>Saabub:</strong> {calculateArrivalTime(selectedFlight.time, selectedFlight.duration)}</div>
                  </div>
                  <div>
                    <div><strong>Kestus:</strong> {selectedFlight.duration}</div>
                    <div><strong style={{ color: '#d4476f' }}>Hind:</strong> €{selectedFlight.price}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Piletite arv:
                </label>
                <select 
                  value={ticketCount} 
                  onChange={(e) => setTicketCount(Number(e.target.value))}
                  style={{ 
                    padding: '8px', 
                    width: '100%', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Iste eelistused (soovituslik):</div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={seatPreferences.together}
                    onChange={() => 
                      setSeatPreferences(prev => ({...prev, together: !prev.together}))
                    }
                  />
                  {' '}Kõrvuti istekohad (2 piletit)
                </label>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={seatPreferences.window}
                    onChange={() => 
                      setSeatPreferences(prev => ({...prev, window: !prev.window}))
                    }
                  />
                  {' '}Aknaäärne iste (A/F)
                </label>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={seatPreferences.legroom}
                    onChange={() => 
                      setSeatPreferences(prev => ({...prev, legroom: !prev.legroom}))
                    }
                  />
                  {' '}Lisa jalaruum (rida 1)
                </label>
              </div>
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px',
                border: '1px solid #eee' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div>Lend ({ticketCount} {ticketCount === 1 ? 'pilet' : 'piletit'})</div>
                  <div>€{selectedFlight.price * ticketCount}</div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold', 
                  marginTop: '10px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #ddd' 
                }}>
                  <div>Kokku (ilma istekohtadeta):</div>
                  <div>€{selectedFlight.price * ticketCount}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={handleConfirmBooking}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Vali istekohad
                </button>
                <button 
                  onClick={() => setSelectedFlight(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    marginLeft: '10px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Tühista
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Laadin lennuinfot...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>Lennu Otsing</h1>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
        <div>
          <label>Vali kuupäev: </label>
          <DatePicker selected={date} onChange={setDate} />
        </div>
        <div>
          <label>Sort: </label>
          <select onChange={(e) => setSortKey(e.target.value)}>
            <option value="time">Väljumisaeg</option>
            <option value="priceAsc">Hind: odav → kallis</option>
            <option value="priceDesc">Hind: kallis → odav</option>
            <option value="durationAsc">Kestvus: lühike → pikk</option>
            <option value="durationDesc">Kestvus: pikk → lühike</option>
          </select>
        </div>
      </div>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <h3>Filtrid</h3>
        <div style={{ marginTop: '10px' }}>
          <label>Max lennu kestus: {formatDuration(maxDuration)}</label>
          <div style={{ marginTop: '5px' }}>
            <input 
              type="range" 
              min="60" 
              max="360" 
              step="15"
              value={maxDuration} 
              onChange={(e) => setMaxDuration(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginTop: '15px' }}>
          <label>Sihtkoht: </label>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '8px'
          }}>
            {destinations.map(country => (
              <div key={country} style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox" 
                  id={`country-${country}`} 
                  value={country} 
                  checked={selectedCountries.includes(country)}
                  onChange={handleCountryChange}
                />
                <label htmlFor={`country-${country}`} style={{ marginLeft: '5px' }}>{country}</label>
              </div>
            ))}
          </div>
          {selectedCountries.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              <button onClick={() => setSelectedCountries([])}>Clear ({selectedCountries.length})</button>
            </div>
          )}
        </div>
      </div>
      <h2>Lennud kuupäeval: {formatDate(date)}</h2>
      {filteredAndSortedFlights.length === 0 ? (
        <p>Ei leitud lende nende filtritega.</p>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px', 
          justifyContent: 'space-between' 
        }}>
          {filteredAndSortedFlights.map((flight, i) => (
            <div 
              key={i} 
              onClick={() => handleFlightSelect(flight)}
              style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                flex: '1 1 calc(50% - 15px)',
                minWidth: '280px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.1s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '30px',
                height: '30px',
                background: '#f0f0f0',
                borderBottomLeftRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '18px',
                color: '#555'
              }}>
                ✓
              </div>
              <div style={{ 
                fontSize: '18px', 
                marginBottom: '10px', 
                fontWeight: 'bold'
              }}>
                ✈️ {flight.from} → {flight.to}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                color: '#555',
                marginBottom: '5px'
              }}>
                <div>
                  <div><strong>Väljub:</strong> {flight.time}</div>
                  <div><strong>Saabub:</strong> {calculateArrivalTime(flight.time, flight.duration)}</div>
                </div>
                <div>
                  <div><strong>Kestus:</strong> {flight.duration}</div>
                  <div><strong style={{ color: '#d4476f' }}>Hind:</strong> €{flight.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedFlight && <BookingDetails />}
    </div>
  );
}

export default App;
