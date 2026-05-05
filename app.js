const express = require('express');
const app = express();
const port = 3000;

const commonStyle = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
        body {
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #f8fafc;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 3rem;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            animation: fadeIn 0.8s ease-out;
        }
        h1 {
            font-weight: 600;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2.5rem;
        }
        p {
            color: #94a3b8;
            line-height: 1.6;
        }
        .nav {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        .nav a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            background: rgba(56, 189, 248, 0.1);
            transition: all 0.3s ease;
        }
        .nav a:hover {
            background: rgba(56, 189, 248, 0.2);
            transform: translateY(-2px);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
`;

// Root route
app.get('/', (req, res) => {
    res.send(`
        ${commonStyle}
        <div class="card">
            <h1>App Page</h1>
            <p>Welcome to the main application page. Experience the future of backend development.</p>
            <div class="nav">
                <a href="/hello">Go to Hello Page</a>
            </div>
        </div>
    `);
});

// Hello route
app.get('/hello', (req, res) => {
    res.send(`
        ${commonStyle}
        <div class="card">
            <h1>Hello Page</h1>
            <p>Hi there! This is the hello page, beautifully rendered with modern aesthetics.</p>
            <div class="nav">
                <a href="/">Back to App Page</a>
            </div>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});