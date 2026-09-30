const Database = require("better-sqlite3");
const path = require("path");

const caminhoBanco = path.join(__dirname, "precojusto.db");

const db = new Database(caminhoBanco);

db.pragma("foreign_keys = ON");

// ============================================================
// TABELA DE PRODUTOS
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descricao TEXT,
        imagem TEXT
    )
`);

// ============================================================
// TABELA DE PREÇOS
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS precos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        loja TEXT NOT NULL,
        preco REAL NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        url TEXT,
        FOREIGN KEY (produto_id)
            REFERENCES produtos(id)
            ON DELETE CASCADE
    )
`);


// ============================================================
// CORREÇÃO/MIGRAÇÃO DA COLUNA URL
// ============================================================

const colunasPrecosUrl = db
    .prepare("PRAGMA table_info(precos)")
    .all();

const possuiColunaUrl = colunasPrecosUrl.some(
    coluna => coluna.name === "url"
);

if (!possuiColunaUrl) {
    db.exec(`
        ALTER TABLE precos
        ADD COLUMN url TEXT
    `);

    console.log("Coluna 'url' adicionada à tabela precos.");
}

const colunasPrecos = db
    .prepare("PRAGMA table_info(precos)")
    .all();

const possuiColunaData = colunasPrecos.some(
    coluna => coluna.name === "data"
);

if (!possuiColunaData) {
    db.exec(`
        ALTER TABLE precos
        ADD COLUMN data DATETIME
    `);

    db.exec(`
        UPDATE precos
        SET data = CURRENT_TIMESTAMP
        WHERE data IS NULL
    `);

    console.log("Coluna 'data' adicionada à tabela precos.");
}

// ============================================================
// TABELA DE USUÁRIOS
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ============================================================
// TABELA DE SESSÕES
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS sessoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE
    )
`);

// ============================================================
// TABELA DE FAVORITOS
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS favoritos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,
        FOREIGN KEY (produto_id)
            REFERENCES produtos(id)
            ON DELETE CASCADE,
        UNIQUE(usuario_id, produto_id)
    )
`);

// ============================================================
// TABELA DE ALERTAS DE PREÇO
// ============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        preco_alvo REAL NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atingido_em DATETIME,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,
        FOREIGN KEY (produto_id)
            REFERENCES produtos(id)
            ON DELETE CASCADE
    )
`);

console.log("Tabela de alertas verificada.");

// ============================================================
// PRODUTOS
// ============================================================

const produtos = [
    {
        nome: "RTX 4060 8GB",
        categoria: "Placas de vídeo",
        descricao:
            "Placa de vídeo NVIDIA GeForce RTX 4060 com 8GB de memória.",
        imagem:
            "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "iPhone 15 128GB",
        categoria: "Celulares",
        descricao:
            "Smartphone Apple iPhone 15 com 128GB de armazenamento.",
        imagem:
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "AirPods Pro 2",
        categoria: "Fones",
        descricao:
            "Fones de ouvido sem fio Apple AirPods Pro de segunda geração.",
        imagem:
            "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "PlayStation 5 Slim",
        categoria: "Games",
        descricao:
            "Console PlayStation 5 Slim com armazenamento SSD.",
        imagem:
            "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "Samsung Galaxy S24",
        categoria: "Celulares",
        descricao:
            "Smartphone Samsung Galaxy S24.",
        imagem:
            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "Notebook Lenovo IdeaPad 3",
        categoria: "Notebooks",
        descricao:
            "Notebook Lenovo IdeaPad 3 para estudos, trabalho e uso diário.",
        imagem:
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: 'Smart TV Samsung 55" 4K',
        categoria: "TVs",
        descricao:
            "Smart TV Samsung de 55 polegadas com resolução 4K.",
        imagem:
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80"
    },
    {
        nome: "Teclado Mecânico Redragon",
        categoria: "Periféricos",
        descricao:
            "Teclado mecânico Redragon para computadores e jogos.",
        imagem:
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80"
    }
];

// ============================================================
// INSERÇÃO DOS PRODUTOS
// ============================================================

const quantidadeProdutos = db
    .prepare("SELECT COUNT(*) AS total FROM produtos")
    .get();

if (quantidadeProdutos.total === 0) {
    const inserirProduto = db.prepare(`
        INSERT INTO produtos
        (nome, categoria, descricao, imagem)
        VALUES (?, ?, ?, ?)
    `);

    const inserirTodos = db.transaction(() => {
        for (const produto of produtos) {
            inserirProduto.run(
                produto.nome,
                produto.categoria,
                produto.descricao,
                produto.imagem
            );
        }
    });

    inserirTodos();

    console.log("Produtos cadastrados no banco.");
}

// ============================================================
// CORREÇÃO DAS IMAGENS
// ============================================================

const atualizarImagem = db.prepare(`
    UPDATE produtos
    SET imagem = ?
    WHERE nome = ?
`);

for (const produto of produtos) {
    atualizarImagem.run(
        produto.imagem,
        produto.nome
    );
}

console.log("Imagens dos produtos verificadas.");

// ============================================================
// PREÇOS INICIAIS
// ============================================================

const quantidadePrecos = db
    .prepare("SELECT COUNT(*) AS total FROM precos")
    .get();

if (quantidadePrecos.total === 0) {
    const precosIniciais = [
        {
            produto: "RTX 4060 8GB",
            loja: "Kabum",
            preco: 1899.90
        },
        {
            produto: "RTX 4060 8GB",
            loja: "Pichau",
            preco: 1949.90
        },
        {
            produto: "RTX 4060 8GB",
            loja: "Amazon",
            preco: 1999.90
        },
        {
            produto: "iPhone 15 128GB",
            loja: "Amazon",
            preco: 4199.90
        },
        {
            produto: "iPhone 15 128GB",
            loja: "Magalu",
            preco: 4299.90
        },
        {
            produto: "iPhone 15 128GB",
            loja: "Mercado Livre",
            preco: 4099.90
        },
        {
            produto: "AirPods Pro 2",
            loja: "Amazon",
            preco: 1899.90
        },
        {
            produto: "AirPods Pro 2",
            loja: "Fast Shop",
            preco: 1999.90
        },
        {
            produto: "AirPods Pro 2",
            loja: "Magalu",
            preco: 1949.90
        },
        {
            produto: "PlayStation 5 Slim",
            loja: "Amazon",
            preco: 3599.90
        },
        {
            produto: "PlayStation 5 Slim",
            loja: "Kabum",
            preco: 3499.90
        },
        {
            produto: "PlayStation 5 Slim",
            loja: "Mercado Livre",
            preco: 3399.90
        },
        {
            produto: "Samsung Galaxy S24",
            loja: "Amazon",
            preco: 3299.90
        },
        {
            produto: "Samsung Galaxy S24",
            loja: "Magalu",
            preco: 3199.90
        },
        {
            produto: "Samsung Galaxy S24",
            loja: "Fast Shop",
            preco: 3399.90
        },
        {
            produto: "Notebook Lenovo IdeaPad 3",
            loja: "Amazon",
            preco: 2899.90
        },
        {
            produto: "Notebook Lenovo IdeaPad 3",
            loja: "Kabum",
            preco: 2799.90
        },
        {
            produto: "Notebook Lenovo IdeaPad 3",
            loja: "Magalu",
            preco: 2949.90
        },
        {
            produto: 'Smart TV Samsung 55" 4K',
            loja: "Amazon",
            preco: 3199.90
        },
        {
            produto: 'Smart TV Samsung 55" 4K',
            loja: "Casas Bahia",
            preco: 2999.90
        },
        {
            produto: 'Smart TV Samsung 55" 4K',
            loja: "Magalu",
            preco: 3099.90
        },
        {
            produto: "Teclado Mecânico Redragon",
            loja: "Amazon",
            preco: 249.90
        },
        {
            produto: "Teclado Mecânico Redragon",
            loja: "Kabum",
            preco: 229.90
        },
        {
            produto: "Teclado Mecânico Redragon",
            loja: "Pichau",
            preco: 239.90
        }
    ];

    const buscarProduto = db.prepare(`
        SELECT id
        FROM produtos
        WHERE nome = ?
    `);

    const inserirPreco = db.prepare(`
        INSERT INTO precos
        (produto_id, loja, preco, data)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const inserirPrecos = db.transaction(() => {
        for (const item of precosIniciais) {
            const produto = buscarProduto.get(item.produto);

            if (produto) {
                inserirPreco.run(
                    produto.id,
                    item.loja,
                    item.preco
                );
            }
        }
    });

    inserirPrecos();

    console.log("Preços iniciais cadastrados.");
}

// ============================================================
// FINAL
// ============================================================

console.log("Banco de dados PreçoJusto carregado.");

module.exports = db;