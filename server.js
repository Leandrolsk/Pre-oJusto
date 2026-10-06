const express = require("express");
const path = require("path");
const crypto = require("crypto");
const db = require("./database");

// ================================
// MERCADO LIVRE - CONFIGURAÇÃO OAUTH
// ================================

const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

const ML_REDIRECT_URI =
    "https://precojusto.onrender.com/api/mercadolivre/callback";

let mlAccessToken = null;
let mlRefreshToken = null;

const app = express();

// ================================
// CORS
// ================================

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

const PORT = 3000;

// ================================
// CONFIGURAÇÕES
// ================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);

// ================================
// FUNÇÕES DE AUTENTICAÇÃO
// ================================

function gerarHashSenha(senha) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(senha, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}

function verificarSenha(senha, senhaHash) {
    const partes = senhaHash.split(":");

    if (partes.length !== 2) {
        return false;
    }

    const salt = partes[0];
    const hashOriginal = partes[1];

    const hashTentativa = crypto
        .scryptSync(senha, salt, 64)
        .toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(hashOriginal, "hex"),
        Buffer.from(hashTentativa, "hex")
    );
}

function gerarToken() {
    return crypto.randomBytes(32).toString("hex");
}

function obterUsuario(req) {
    const header = req.headers.authorization;

    if (!header) {
        return null;
    }

    if (!header.startsWith("Bearer ")) {
        return null;
    }

    const token = header.substring(7);

    const sessao = db.prepare(`
        SELECT
            usuarios.id,
            usuarios.nome,
            usuarios.email
        FROM sessoes
        INNER JOIN usuarios
            ON usuarios.id = sessoes.usuario_id
        WHERE sessoes.token = ?
    `).get(token);

    return sessao || null;
}

// ================================
// CADASTRO
// ================================

app.post("/api/auth/cadastro", (req, res) => {
    try {
        const {
            nome,
            email,
            senha
        } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                erro: "Preencha todos os campos."
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                erro: "A senha precisa ter pelo menos 6 caracteres."
            });
        }

        const emailNormalizado =
            email.trim().toLowerCase();

        const usuarioExistente = db
            .prepare(
                "SELECT id FROM usuarios WHERE email = ?"
            )
            .get(emailNormalizado);

        if (usuarioExistente) {
            return res.status(409).json({
                erro: "Este email já está cadastrado."
            });
        }

        const senhaHash =
            gerarHashSenha(senha);

        const resultado = db
            .prepare(`
                INSERT INTO usuarios
                (nome, email, senha_hash)
                VALUES (?, ?, ?)
            `)
            .run(
                nome.trim(),
                emailNormalizado,
                senhaHash
            );

        const token = gerarToken();

        db.prepare(`
            INSERT INTO sessoes
            (usuario_id, token)
            VALUES (?, ?)
        `).run(
            resultado.lastInsertRowid,
            token
        );

        res.status(201).json({
            mensagem: "Conta criada com sucesso!",
            token,
            usuario: {
                id: resultado.lastInsertRowid,
                nome: nome.trim(),
                email: emailNormalizado
            }
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar a conta."
        });
    }
});

// ================================
// LOGIN
// ================================

app.post("/api/auth/login", (req, res) => {
    try {
        const {
            email,
            senha
        } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                erro: "Informe email e senha."
            });
        }

        const emailNormalizado =
            email.trim().toLowerCase();

        const usuario = db
            .prepare(`
                SELECT *
                FROM usuarios
                WHERE email = ?
            `)
            .get(emailNormalizado);

        if (!usuario) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        const senhaValida =
            verificarSenha(
                senha,
                usuario.senha_hash
            );

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        const token = gerarToken();

        db.prepare(`
            INSERT INTO sessoes
            (usuario_id, token)
            VALUES (?, ?)
        `).run(
            usuario.id,
            token
        );

        res.json({
            mensagem: "Login realizado!",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});

// ================================
// USUÁRIO LOGADO
// ================================

app.get("/api/auth/me", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Não autenticado."
        });
    }

    res.json({
        usuario
    });
});

// ================================
// LOGOUT
// ================================

app.post("/api/auth/logout", (req, res) => {
    const header =
        req.headers.authorization;

    if (header && header.startsWith("Bearer ")) {
        const token = header.substring(7);

        db.prepare(`
            DELETE FROM sessoes
            WHERE token = ?
        `).run(token);
    }

    res.json({
        mensagem: "Logout realizado."
    });
});

// ==================================================
// PRODUTOS
// ==================================================

app.get("/api/produtos", (req, res) => {
    try {
        const produtos = db.prepare(`
            SELECT
                p.id,
                p.nome,
                p.categoria,
                p.descricao,
                p.imagem,
                MIN(pr.preco) AS menor_preco
            FROM produtos p
            LEFT JOIN precos pr
                ON pr.produto_id = p.id
            GROUP BY p.id
            ORDER BY p.id
        `).all();

        const produtosComPrecos = produtos.map(produto => {
            const precos = db.prepare(`
                SELECT
                    loja,
                    preco,
                    data,
                    url
                FROM precos
                WHERE produto_id = ?
                ORDER BY preco ASC
            `).all(produto.id);

            return {
                ...produto,
                precos
            };
        });

        res.json(produtosComPrecos);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar produtos."
        });
    }
});
// ==================================================
// PRODUTO INDIVIDUAL
// ==================================================

app.get("/api/produtos/:id", (req, res) => {
    try {
        const produtoId =
            Number(req.params.id);

        const produto = db.prepare(`
            SELECT
                id,
                nome,
                categoria,
                descricao,
                imagem
            FROM produtos
            WHERE id = ?
        `).get(produtoId);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const precos = db.prepare(`
    SELECT
        p1.loja,
        p1.preco,
        p1.data,
        p1.url
    FROM precos p1
            INNER JOIN (
                SELECT
                    loja,
                    MAX(id) AS ultimo_id
                FROM precos
                WHERE produto_id = ?
                GROUP BY loja
            ) p2
                ON p1.id = p2.ultimo_id
            WHERE p1.produto_id = ?
            ORDER BY p1.preco ASC
        `).all(
            produtoId,
            produtoId
        );

        res.json({
            ...produto,
            precos
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar produto."
        });
    }
});

// ==================================================
// HISTÓRICO DE PREÇOS
// ==================================================

app.get("/api/produtos/:id/historico", (req, res) => {
    try {
        const produtoId =
            Number(req.params.id);

        const produto = db
            .prepare(`
                SELECT
                    id,
                    nome
                FROM produtos
                WHERE id = ?
            `)
            .get(produtoId);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const historico = db.prepare(`
            SELECT
                id,
                loja,
                preco,
                data
            FROM precos
            WHERE produto_id = ?
            ORDER BY datetime(data) ASC, id ASC
        `).all(produtoId);

        const estatisticas = db.prepare(`
            SELECT
                MIN(preco) AS menor_preco,
                MAX(preco) AS maior_preco,
                AVG(preco) AS preco_medio,
                COUNT(*) AS quantidade_registros
            FROM precos
            WHERE produto_id = ?
        `).get(produtoId);

        const menorPreco = db.prepare(`
            SELECT
                preco,
                loja,
                data
            FROM precos
            WHERE produto_id = ?
            ORDER BY preco ASC, datetime(data) ASC
            LIMIT 1
        `).get(produtoId);

        const ultimoRegistro = db.prepare(`
            SELECT
                preco,
                loja,
                data
            FROM precos
            WHERE produto_id = ?
            ORDER BY datetime(data) DESC, id DESC
            LIMIT 1
        `).get(produtoId);

        const porLoja = db.prepare(`
            SELECT
                loja,
                preco,
                data
            FROM precos
            WHERE produto_id = ?
            ORDER BY loja ASC, datetime(data) ASC, id ASC
        `).all(produtoId);

        res.json({
            produto,
            estatisticas: {
                menor_preco: estatisticas.menor_preco,
                maior_preco: estatisticas.maior_preco,
                preco_medio: estatisticas.preco_medio,
                quantidade_registros:
                    estatisticas.quantidade_registros
            },
            menor_preco: menorPreco || null,
            ultimo_registro: ultimoRegistro || null,
            historico,
            por_loja: porLoja
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar histórico de preços."
        });
    }
});

// ==================================================
// REGISTRAR NOVO PREÇO
// ==================================================

app.post("/api/produtos/:id/precos", (req, res) => {
    try {
        const produtoId =
            Number(req.params.id);

        const {
            loja,
            preco,
            url
        } = req.body;

        if (!loja || preco === undefined) {
            return res.status(400).json({
                erro: "Informe a loja e o preço."
            });
        }

        const precoNumerico =
            Number(preco);

        if (
            !Number.isFinite(precoNumerico) ||
            precoNumerico <= 0
        ) {
            return res.status(400).json({
                erro: "Informe um preço válido."
            });
        }

        const produto = db
            .prepare(
                "SELECT id FROM produtos WHERE id = ?"
            )
            .get(produtoId);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const resultado = db.prepare(`
            INSERT INTO precos
(produto_id, loja, preco, data, url)
VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        `).run(
    produtoId,
    loja.trim(),
    precoNumerico,
    url ? url.trim() : null
);

        const novoPreco = db
    .prepare(`
        SELECT
            id,
            loja,
            preco,
            data,
            url
        FROM precos
                WHERE id = ?
            `)
            .get(resultado.lastInsertRowid);

        // Verifica se algum alerta foi atingido
        db.prepare(`
            UPDATE alertas
            SET
                ativo = 0,
                atingido_em = CURRENT_TIMESTAMP
            WHERE produto_id = ?
              AND ativo = 1
              AND preco_alvo >= ?
        `).run(
            produtoId,
            precoNumerico
        );

        res.status(201).json({
            mensagem: "Preço registrado com sucesso.",
            preco: novoPreco
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao registrar preço."
        });
    }
});

// ==================================================
// CATEGORIAS
// ==================================================

app.get("/api/categorias", (req, res) => {
    try {
        const categorias = db.prepare(`
            SELECT DISTINCT categoria
            FROM produtos
            ORDER BY categoria
        `).all();

        res.json(
            categorias.map(
                item => item.categoria
            )
        );
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar categorias."
        });
    }
});

// ==================================================
// FAVORITOS
// ==================================================

// Listar favoritos do usuário

app.get("/api/favoritos", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    try {
        const favoritos = db.prepare(`
            SELECT
                p.id,
                p.nome,
                p.categoria,
                p.descricao,
                p.imagem,
                MIN(pr.preco) AS menor_preco
            FROM favoritos f
            INNER JOIN produtos p
                ON p.id = f.produto_id
            LEFT JOIN precos pr
                ON pr.produto_id = p.id
            WHERE f.usuario_id = ?
            GROUP BY p.id
            ORDER BY f.criado_em DESC
        `).all(usuario.id);

        res.json(favoritos);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao carregar favoritos."
        });
    }
});

// Adicionar favorito

app.post("/api/favoritos/:produtoId", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const produtoId =
        Number(req.params.produtoId);

    const produto = db
        .prepare(
            "SELECT id FROM produtos WHERE id = ?"
        )
        .get(produtoId);

    if (!produto) {
        return res.status(404).json({
            erro: "Produto não encontrado."
        });
    }

    try {
        db.prepare(`
            INSERT OR IGNORE INTO favoritos
            (usuario_id, produto_id)
            VALUES (?, ?)
        `).run(
            usuario.id,
            produtoId
        );

        res.json({
            mensagem:
                "Produto adicionado aos favoritos."
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao adicionar favorito."
        });
    }
});

// Remover favorito

app.delete("/api/favoritos/:produtoId", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const produtoId =
        Number(req.params.produtoId);

    try {
        db.prepare(`
            DELETE FROM favoritos
            WHERE usuario_id = ?
            AND produto_id = ?
        `).run(
            usuario.id,
            produtoId
        );

        res.json({
            mensagem:
                "Produto removido dos favoritos."
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao remover favorito."
        });
    }
});

// ==================================================
// ALERTAS DE PREÇO
// ==================================================

// Criar alerta

app.post("/api/alertas", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    try {
        const {
            produto_id,
            preco_alvo
        } = req.body;

        const produtoId = Number(produto_id);
        const precoAlvo = Number(preco_alvo);

        if (
            !Number.isInteger(produtoId) ||
            produtoId <= 0
        ) {
            return res.status(400).json({
                erro: "Produto inválido."
            });
        }

        if (
            !Number.isFinite(precoAlvo) ||
            precoAlvo <= 0
        ) {
            return res.status(400).json({
                erro: "Informe um preço-alvo válido."
            });
        }

        const produto = db
            .prepare(`
                SELECT id, nome
                FROM produtos
                WHERE id = ?
            `)
            .get(produtoId);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const alertaExistente = db
            .prepare(`
                SELECT id
                FROM alertas
                WHERE usuario_id = ?
                  AND produto_id = ?
                  AND ativo = 1
            `)
            .get(
                usuario.id,
                produtoId
            );

        let alertaId;
        let atualizado = false;

        if (alertaExistente) {
            db.prepare(`
                UPDATE alertas
                SET preco_alvo = ?
                WHERE id = ?
                  AND usuario_id = ?
            `).run(
                precoAlvo,
                alertaExistente.id,
                usuario.id
            );

            alertaId = alertaExistente.id;
            atualizado = true;
        } else {
            const resultado = db
                .prepare(`
                    INSERT INTO alertas
                    (
                        usuario_id,
                        produto_id,
                        preco_alvo
                    )
                    VALUES (?, ?, ?)
                `)
                .run(
                    usuario.id,
                    produtoId,
                    precoAlvo
                );

            alertaId = resultado.lastInsertRowid;
        }

        const alerta = db
            .prepare(`
                SELECT
                    a.id,
                    a.produto_id,
                    p.nome AS produto_nome,
                    a.preco_alvo,
                    a.ativo,
                    a.criado_em,
                    a.atingido_em
                FROM alertas a
                INNER JOIN produtos p
                    ON p.id = a.produto_id
                WHERE a.id = ?
            `)
            .get(alertaId);

        res.status(atualizado ? 200 : 201).json({
            mensagem: atualizado
                ? "Alerta atualizado com sucesso."
                : "Alerta criado com sucesso.",
            atualizado,
            alerta
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar alerta."
        });
    }
});

// Listar alertas do usuário

app.get("/api/alertas", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    try {
        const alertas = db.prepare(`
            SELECT
                a.id,
                a.produto_id,
                p.nome AS produto_nome,
                p.imagem AS produto_imagem,
                a.preco_alvo,
                a.ativo,
                a.criado_em,
                a.atingido_em,
                MIN(pr.preco) AS menor_preco_atual,
                MIN(pr.preco) AS preco_atual
            FROM alertas a
            INNER JOIN produtos p
                ON p.id = a.produto_id
            LEFT JOIN precos pr
                ON pr.produto_id = p.id
            WHERE a.usuario_id = ?
            GROUP BY a.id
            ORDER BY a.ativo DESC, a.criado_em DESC
        `).all(usuario.id);

        res.json(alertas);
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao carregar alertas."
        });
    }
});

// Remover alerta

app.delete("/api/alertas/:id", (req, res) => {
    const usuario = obterUsuario(req);

    if (!usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    try {
        const alertaId =
            Number(req.params.id);

        const resultado = db
            .prepare(`
                DELETE FROM alertas
                WHERE id = ?
                  AND usuario_id = ?
            `)
            .run(
                alertaId,
                usuario.id
            );

        if (resultado.changes === 0) {
            return res.status(404).json({
                erro: "Alerta não encontrado."
            });
        }

        res.json({
            mensagem: "Alerta removido com sucesso."
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao remover alerta."
        });
    }
});



// ==================================================
// MERCADO LIVRE - INICIAR AUTORIZAÇÃO
// ==================================================

app.get("/api/mercadolivre/autorizar", (req, res) => {
    if (!ML_CLIENT_ID) {
        return res.status(500).json({
            erro: "ML_CLIENT_ID não configurado."
        });
    }

    const urlAutorizacao =
        "https://auth.mercadolivre.com.br/authorization" +
        "?response_type=code" +
        `&client_id=${encodeURIComponent(ML_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}`;

    res.redirect(urlAutorizacao);
});



// ==================================================
// MERCADO LIVRE - CALLBACK OAUTH
// ==================================================

app.get("/api/mercadolivre/callback", async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            return res.status(400).json({
                erro: "Autorização do Mercado Livre recusada.",
                detalhes: error
            });
        }

        if (!code) {
            return res.status(400).json({
                erro: "Código de autorização não recebido."
            });
        }

        if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
            return res.status(500).json({
                erro: "Credenciais do Mercado Livre não configuradas."
            });
        }

        const resposta = await fetch(
            "https://api.mercadolibre.com/oauth/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: ML_CLIENT_ID,
                    client_secret: ML_CLIENT_SECRET,
                    code,
                    redirect_uri: ML_REDIRECT_URI
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error(
                "Erro ao gerar token do Mercado Livre:",
                dados
            );

            return res.status(resposta.status).json({
                erro: "Não foi possível gerar o Access Token.",
                detalhes: dados
            });
        }

             mlAccessToken = dados.access_token;
             mlRefreshToken = dados.refresh_token || null;

             console.log(
             "Mercado Livre autorizado com sucesso."
        );

        res.json({
            sucesso: true,
            mensagem:
                "PreçoJusto conectado ao Mercado Livre com sucesso."
        });

    } catch (erro) {
        console.error(
            "Erro no callback do Mercado Livre:",
            erro
        );

        res.status(500).json({
            erro: "Erro ao concluir autorização do Mercado Livre."
        });
    }
});




// ==================================================
// TESTE - BUSCAR PRODUTO NO CATÁLOGO MERCADO LIVRE
// ==================================================

app.get(
    "/api/mercadolivre/buscar-produto",
    async (req, res) => {
        try {
            const termo = String(req.query.q || "").trim();

            if (!termo) {
                return res.status(400).json({
                    erro: "Informe um produto para pesquisar."
                });
            }

            if (!mlAccessToken) {
                return res.status(401).json({
                    erro: "Mercado Livre ainda não foi autorizado."
                });
            }

            const url =
                "https://api.mercadolibre.com/products/search" +
                `?status=active&site_id=MLB&q=${encodeURIComponent(termo)}`;

            const resposta = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${mlAccessToken}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                return res.status(resposta.status).json({
                    erro: "Erro ao pesquisar produto no Mercado Livre.",
                    status: resposta.status,
                    detalhes: dados
                });
            }

            const resultados = Array.isArray(dados.results)
                ? dados.results
                : [];

            res.json({
                busca: termo,
                total: resultados.length,
                produtos: resultados.map(produto => ({
                    id: produto.id || null,
                    nome: produto.name || null,
                    dominio: produto.domain_id || null,
                    imagem:
                        produto.pictures?.[0]?.url ||
                        produto.pictures?.[0]?.secure_url ||
                        null
                }))
            });

        } catch (erro) {
            console.error(
                "Erro ao pesquisar catálogo do Mercado Livre:",
                erro
            );

            res.status(500).json({
                erro: "Não foi possível pesquisar o catálogo."
            });
        }
    }
);



// ==================================================
// TESTE - OFERTAS DO CATÁLOGO MERCADO LIVRE
// ==================================================

app.get(
    "/api/mercadolivre/ofertas/:catalogId",
    async (req, res) => {
        try {
            const catalogId = req.params.catalogId
                .trim()
                .toUpperCase();

            if (!/^MLB\d+$/.test(catalogId)) {
                return res.status(400).json({
                    erro: "ID de catálogo inválido."
                });
            }

            if (!mlAccessToken) {
                return res.status(401).json({
                    erro: "Mercado Livre ainda não foi autorizado."
                });
            }

            const url =
                "https://api.mercadolibre.com/sites/MLB/search" +
                `?catalog_product_id=${encodeURIComponent(catalogId)}`;

            const resposta = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${mlAccessToken}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                return res.status(resposta.status).json({
                    erro: "Erro ao buscar ofertas do Mercado Livre.",
                    status: resposta.status,
                    detalhes: dados
                });
            }

            const resultados = Array.isArray(dados.results)
                ? dados.results
                : [];

            res.json({
                catalogId,
                total:
                    dados.paging?.total ??
                    resultados.length,
                ofertas: resultados.map(item => ({
                    id: item.id || null,
                    titulo: item.title || null,
                    preco: item.price ?? null,
                    precoOriginal:
                        item.original_price ?? null,
                    moeda: item.currency_id || null,
                    disponivel:
                        item.available_quantity ?? null,
                    condicao: item.condition || null,
                    link: item.permalink || null,
                    imagem: item.thumbnail || null
                }))
            });

        } catch (erro) {
            console.error(
                "Erro ao buscar ofertas do Mercado Livre:",
                erro
            );

            res.status(500).json({
                erro: "Não foi possível buscar as ofertas."
            });
        }
    }
);


// ==================================================
// TESTE - API DO MERCADO LIVRE
// ==================================================

app.get("/api/mercadolivre/produto/:catalogId", async (req, res) => {
    try {
        const catalogId = req.params.catalogId
            .trim()
            .toUpperCase();

        if (!/^MLB\d+$/.test(catalogId)) {
            return res.status(400).json({
                erro: "ID de catálogo inválido."
            });
        }

        const url =
            `https://api.mercadolibre.com/products/${catalogId}`;

        if (!mlAccessToken) {
    return res.status(401).json({
        erro: "Mercado Livre ainda não foi autorizado."
    });
}

const resposta = await fetch(url, {
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${mlAccessToken}`
    }
});

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error(
                "Erro Mercado Livre:",
                resposta.status,
                dados
            );

            return res.status(resposta.status).json({
                erro: "Erro ao consultar o Mercado Livre.",
                status: resposta.status,
                detalhes: dados
            });
        }

        const imagens = Array.isArray(dados.pictures)
            ? dados.pictures
                .map(imagem => imagem.url || imagem.secure_url)
                .filter(Boolean)
            : [];

         console.log(
            "Resposta completa do Mercado Livre:",
         JSON.stringify(dados, null, 2)
         );

        res.json({
            id: dados.id || catalogId,
            nome: dados.name || null,
            dominio: dados.domain_id || null,
             buyBoxWinner: dados.buy_box_winner || null,
            imagem: imagens[0] || null,
            imagens,
            atributos: Array.isArray(dados.attributes)
                ? dados.attributes.map(atributo => ({
                    id: atributo.id,
                    nome: atributo.name,
                    valor:
                        atributo.value_name ||
                        atributo.value_id ||
                        null
                }))
                : []
        });

    } catch (erro) {
        console.error(
            "Erro ao consultar API do Mercado Livre:",
            erro
        );

        res.status(500).json({
            erro: "Não foi possível consultar o Mercado Livre."
        });
    }
});


// ==================================================
// STATUS
// ==================================================

app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        projeto: "PreçoJusto",
        versao: "2.5"
    });
});

// ==================================================
// PÁGINA PRINCIPAL
// ==================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );
});

// ==================================================
// INICIAR SERVIDOR
// ==================================================

app.listen(PORT, () => {
    console.log("");

    console.log("==================================");
    console.log("     PREÇOJUSTO ESTÁ ONLINE");
    console.log("==================================");

    console.log("");

    console.log(`Acesse: http://localhost:${PORT}`);

    console.log("");
});