// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Cardapio'))); // permite servir o HTML se quiser
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Caminho do banco de dados
const DB_PATH = path.join(__dirname, 'db.json');

// Funções de leitura/escrita
function readDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initialDB = {
            orders: [],
            inventory: [
                // Exemplo de estoque — personalize conforme o restaurante
                { ingredient: "Hambúrguer", quantity: 100 },
                { ingredient: "Pão", quantity: 120 },
                { ingredient: "Queijo", quantity: 80 },
                { ingredient: "Bacon", quantity: 60 }
            ]
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
        return initialDB;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Rota: receber novo pedido
app.post('/orders', (req, res) => {
    const db = readDB();
    const newOrder = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'recebido', // recebido, preparando, pronto, entregue
        ...req.body
    };

    // ⚠️ Aqui você pode adicionar lógica de estoque (opcional por enquanto)
    db.orders.push(newOrder);
    writeDB(db);

    res.json({ success: true, orderId: newOrder.id });
});

// Rota: listar pedidos (para admin)
app.get('/orders', (req, res) => {
    const db = readDB();
    res.json(db.orders);
});

// Rota: atualizar status do pedido
app.patch('/orders/:id/status', (req, res) => {
    const db = readDB();
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const { status } = req.body;
    if (!['recebido', 'preparando', 'pronto', 'entregue', 'cancelado'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json({ success: true });
});

// Rota: obter estoque
app.get('/inventory', (req, res) => {
    const db = readDB();
    res.json(db.inventory);
});

// Rota: atualizar estoque (ex: reabastecer)
app.put('/inventory', (req, res) => {
    const db = readDB();
    db.inventory = req.body; // espera array de { ingredient, quantity }
    writeDB(db);
    res.json({ success: true });
});

// Rota raiz (opcional)
app.get('/', (req, res) => {
    res.send('Backend do Helix Menu - Funcionando!');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Backend rodando para este restaurante na porta ${PORT}`);
    console.log(`📦 Banco de dados: ${DB_PATH}`);
});