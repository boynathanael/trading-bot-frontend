// src/App.js (Versi Final)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// =================================================================
// GANTI DENGAN URL BACKEND ANDA YANG SUDAH DI-DEPLOY DI VERCEL
// =================================================================
const API_URL = 'https://trading-bot-backend-h66a.onrender.com'; // CONTOH URL, GANTI DENGAN MILIK ANDA

function App() {
    // State untuk form input
    const [config, setConfig] = useState({
        symbol: 'BTCUSDT',
        timeframe: '5m',
        diPlusThreshold: 25,
        diMinusThreshold: 20,
        adxMinimum: 20,
        takeProfit: 2,
        stopLoss: 1,
        leverage: 10,
    });
    // State untuk menampilkan riwayat order
    const [orders, setOrders] = useState([]);
    // State untuk menampilkan konfigurasi yang aktif di server
    const [activeConfig, setActiveConfig] = useState(null);
    // State untuk menampilkan pesan status/error
    const [statusMessage, setStatusMessage] = useState('Memuat data awal...');

    // Fungsi untuk mengambil data dari backend
    const fetchData = useCallback(async () => {
            try {
                const configRes = await axios.get(`${API_URL}/config`);
                
                // Cek apakah data yang diterima BUKAN null
                if (configRes.data) {
                    setActiveConfig(configRes.data);
                    setConfig(configRes.data);
                    setStatusMessage('Konfigurasi aktif berhasil dimuat.');
                } else {
                    // Jika data adalah null, set config ke null dan beri pesan
                    setActiveConfig(null);
                    setStatusMessage('Belum ada konfigurasi aktif. Silakan simpan.');
                }

                const ordersRes = await axios.get(`${API_URL}/orders`);
                setOrders(ordersRes.data);
            } catch (error) {
            console.error('Gagal mengambil data dari server:', error);
            setStatusMessage(`Error: Gagal terhubung ke backend. Pastikan backend berjalan di ${API_URL}.`);
        }
    }, []);
    
    // Gunakan useEffect untuk memuat data saat komponen pertama kali render & refresh setiap 5 detik
    useEffect(() => {
        fetchData(); // Panggil sekali saat awal
        const interval = setInterval(fetchData, 5000); // Set interval refresh
        return () => clearInterval(interval); // Bersihkan interval saat komponen di-unmount
    }, [fetchData]);

    // Handler untuk perubahan input di form
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Konversi ke angka jika input adalah number, jika tidak biarkan sebagai string
        const isNumberField = ['diPlusThreshold', 'diMinusThreshold', 'adxMinimum', 'takeProfit', 'stopLoss', 'leverage'].includes(name);
        setConfig(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) : value }));
    };

    // Handler untuk submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('Menyimpan konfigurasi...');
        try {
            const response = await axios.post(`${API_URL}/config`, config);
            alert(response.data.message); // Tampilkan pesan sukses dari server
            await fetchData(); // Muat ulang data setelah simpan
        } catch (error) {
            const errorMessage = error.response ? error.response.data : error.message;
            alert(`Gagal menyimpan konfigurasi! Error: ${errorMessage}`);
            setStatusMessage(`Gagal menyimpan konfigurasi. Error: ${errorMessage}`);
            console.error(error);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Trading Bot Simulator</h1>
                <p className="status-message">{statusMessage}</p>
            </header>
            
            <div className="main-content">
                <section className="form-section">
                    <h2>Form Input Strategi</h2>
                    <form onSubmit={handleSubmit}>
                        {Object.keys(config).map(key => (
                             <div className="form-group" key={key}>
                                <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                <input 
                                    type={typeof config[key] === 'number' ? 'number' : 'text'} 
                                    id={key}
                                    name={key} 
                                    value={config[key]} 
                                    onChange={handleChange} 
                                    required
                                />
                            </div>
                        ))}
                        <button type="submit">Simpan Konfigurasi</button>
                    </form>
                </section>

                <section className="config-section">
                    <h2>Konfigurasi Aktif di Server</h2>
                    {activeConfig ? (
                        <pre>{JSON.stringify(activeConfig, null, 2)}</pre>
                    ) : (
                        <p>Belum ada konfigurasi yang disimpan di server.</p>
                    )}
                </section>
            </div>

            <section className="orders-section">
                <h2>Riwayat Eksekusi Order</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Symbol</th>
                                <th>Aksi</th>
                                <th>Harga Entry</th>
                                <th>Take Profit</th>
                                <th>Stop Loss</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Tambahkan pengecekan ini: pastikan orders adalah array dan tidak kosong */}
                            {Array.isArray(orders) && orders.length > 0 ? (
                                orders.map((order, index) => (
                                    <tr key={index}>
                                        <td>{new Date(order.timestamp).toLocaleString()}</td>
                                        <td>{order.symbol}</td>
                                        <td className={`action-${order.action.toLowerCase()}`}>{order.action}</td>
                                        <td>{order.price_entry}</td>
                                        <td>{order.tp_price}</td>
                                        <td>{order.sl_price}</td>
                                    </tr>
                                ))
                            ) : (
                                // Tampilkan pesan ini jika tidak ada order
                                <tr>
                                    <td colSpan="6">Belum ada order yang dieksekusi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default App;