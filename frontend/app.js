"use strict";

const API_URL = "https://precojusto.onrender.com/api";

const TOKEN_KEY = "precojusto_token";

let produtos = [];
let produtosFiltrados = [];
let categorias = [];
let favoritos = new Set();
let usuarioAtual = null;
let produtoAtual = null;
let categoriaAtual = "Todos";
let pesquisaAtual = "";
let ordenacaoAtual = "relevancia";
let favoritosPesquisaAtual = "";
let favoritosOrdenacaoAtual = "recentes";
let toastTimeout = null;
let alertaPendente = null;

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacao
);

async function iniciarAplicacao() {
    configurarEventos();

    await verificarSessao();

    await Promise.all([
        carregarCategorias(),
        carregarProdutos()
    ]);

    verificarPaginaProduto();
}

/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {
    const searchInput =
        document.getElementById("searchInput");

    const heroSearchInput =
        document.getElementById("heroSearchInput");

    const heroSearchButton =
        document.getElementById("heroSearchButton");

    const sortSelect =
        document.getElementById("sortSelect");

    const favoritesButton =
        document.getElementById("favoritesButton");

    const favoritesEmptyButton =
        document.getElementById("favoritesEmptyButton");

    const backFromFavoritesButton =
        document.getElementById("backFromFavoritesButton");

    const favoritesSearchInput =
        document.getElementById("favoritesSearchInput");

    const clearFavoritesSearchButton =
        document.getElementById("clearFavoritesSearchButton");

    const favoritesSortSelect =
        document.getElementById("favoritesSortSelect");

    const loginButton =
        document.getElementById("loginButton");

    const userButton =
        document.getElementById("userButton");

    const logoutButton =
        document.getElementById("logoutButton");

    const accountButton =
        document.getElementById("accountButton");

    const alertsButton =
        document.getElementById("alertsButton");

    const closeAuthModal =
        document.getElementById("closeAuthModal");

    const showRegisterButton =
        document.getElementById("showRegisterButton");

    const showLoginButton =
        document.getElementById("showLoginButton");

    const loginForm =
        document.getElementById("loginForm");

    const registerForm =
        document.getElementById("registerForm");

    const clearSearchButton =
        document.getElementById("clearSearchButton");

    const backButton =
        document.getElementById("backToProductsButton");

    const backFromAlertsButton =
        document.getElementById("backFromAlertsButton");

    const alertsEmptyButton =
        document.getElementById("alertsEmptyButton");


    /* =====================================================
       BUSCA
    ===================================================== */

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            function () {
                pesquisaAtual =
                    searchInput.value.trim();

                sincronizarBuscaHero();

                aplicarFiltros();
            }
        );

        searchInput.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    aplicarFiltros();
                }
            }
        );
    }


    if (heroSearchInput) {
        heroSearchInput.addEventListener(
            "input",
            function () {
                pesquisaAtual =
                    heroSearchInput.value.trim();

                sincronizarBuscaPrincipal();

                aplicarFiltros();
            }
        );

        heroSearchInput.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    pesquisaAtual =
                        heroSearchInput.value.trim();

                    sincronizarBuscaPrincipal();

                    aplicarFiltros();
                }
            }
        );
    }


    if (heroSearchButton) {
        heroSearchButton.addEventListener(
            "click",
            function () {
                pesquisaAtual =
                    heroSearchInput
                        ? heroSearchInput.value.trim()
                        : "";

                sincronizarBuscaPrincipal();

                aplicarFiltros();

                document
                    .getElementById("productsGrid")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });
            }
        );
    }


    if (sortSelect) {
        sortSelect.addEventListener(
            "change",
            function () {
                ordenacaoAtual =
                    sortSelect.value;

                aplicarFiltros();
            }
        );
    }


    /* =====================================================
       FAVORITOS
    ===================================================== */

    if (favoritesButton) {
        favoritesButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                abrirFavoritos();
            }
        );
    }


    if (favoritesEmptyButton) {
        favoritesEmptyButton.addEventListener(
            "click",
            function () {
                if (favoritosPesquisaAtual) {
                    limparPesquisaFavoritos();
                } else {
                    voltarParaProdutos();
                }
            }
        );
    }


    if (backFromFavoritesButton) {
        backFromFavoritesButton.addEventListener(
            "click",
            voltarParaProdutos
        );
    }


    /* =====================================================
       BUSCA DOS FAVORITOS
    ===================================================== */

    if (favoritesSearchInput) {
        favoritesSearchInput.addEventListener(
            "input",
            function () {
                favoritosPesquisaAtual =
                    favoritesSearchInput.value.trim();

                atualizarBotaoLimparPesquisaFavoritos();

                renderizarPaginaFavoritos();
            }
        );

        favoritesSearchInput.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    renderizarPaginaFavoritos();
                }

                if (
                    event.key === "Escape" &&
                    favoritesSearchInput.value
                ) {
                    limparPesquisaFavoritos();
                }
            }
        );
    }


    if (clearFavoritesSearchButton) {
        clearFavoritesSearchButton.addEventListener(
            "click",
            function () {
                limparPesquisaFavoritos();
            }
        );
    }


    if (favoritesSortSelect) {
        favoritesSortSelect.addEventListener(
            "change",
            function () {
                favoritosOrdenacaoAtual =
                    favoritesSortSelect.value;

                renderizarPaginaFavoritos();
            }
        );
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            abrirAuthModal
        );
    }


    /* =====================================================
       MENU DO USUÁRIO
    ===================================================== */

    if (userButton) {
        userButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                alternarMenuUsuario();
            }
        );
    }


    if (alertsButton) {
        alertsButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                fecharMenuUsuario();

                abrirPaginaAlertas();
            }
        );
    }


    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                fecharMenuUsuario();

                fazerLogout();
            }
        );
    }


    if (accountButton) {
        accountButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                fecharMenuUsuario();

                if (usuarioAtual) {
                    mostrarToast(
                        `Logado como ${
                            usuarioAtual.email ||
                            usuarioAtual.nome
                        }.`
                    );
                }
            }
        );
    }


    /* =====================================================
       MODAL
    ===================================================== */

    if (closeAuthModal) {
        closeAuthModal.addEventListener(
            "click",
            fecharAuthModal
        );
    }


    if (showRegisterButton) {
        showRegisterButton.addEventListener(
            "click",
            mostrarCadastro
        );
    }


    if (showLoginButton) {
        showLoginButton.addEventListener(
            "click",
            mostrarLogin
        );
    }


    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            fazerLogin
        );
    }


    if (registerForm) {
        registerForm.addEventListener(
            "submit",
            fazerCadastro
        );
    }


    /* =====================================================
       OUTROS
    ===================================================== */

    if (clearSearchButton) {
        clearSearchButton.addEventListener(
            "click",
            limparPesquisa
        );
    }


    if (backButton) {
        backButton.addEventListener(
            "click",
            voltarParaProdutos
        );
    }


    if (backFromAlertsButton) {
        backFromAlertsButton.addEventListener(
            "click",
            voltarParaProdutos
        );
    }


    if (alertsEmptyButton) {
        alertsEmptyButton.addEventListener(
            "click",
            voltarParaProdutos
        );
    }


    /* =====================================================
       CLICAR FORA DO MENU
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {
            const userMenu =
                document.getElementById("userMenu");

            if (!userMenu) {
                return;
            }

            if (!userMenu.contains(event.target)) {
                fecharMenuUsuario();
            }
        }
    );


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                fecharAuthModal();
                fecharMenuUsuario();
            }
        }
    );
}

/* =========================================================
   MENU DO USUÁRIO
========================================================= */

function alternarMenuUsuario() {
    const userMenu =
        document.getElementById("userMenu");

    const userDropdown =
        document.getElementById("userDropdown");

    if (!userMenu || !userDropdown) {
        return;
    }

    const estaAberto =
        userMenu.classList.contains("open");

    if (estaAberto) {
        fecharMenuUsuario();
    } else {
        abrirMenuUsuario();
    }
}


function abrirMenuUsuario() {
    const userMenu =
        document.getElementById("userMenu");

    const userDropdown =
        document.getElementById("userDropdown");

    const userButton =
        document.getElementById("userButton");

    if (!userMenu || !userDropdown) {
        return;
    }

    userMenu.classList.add("open");

    userDropdown.classList.remove("hidden");
    userDropdown.classList.add("show");

    userDropdown.setAttribute(
        "aria-hidden",
        "false"
    );

    if (userButton) {
        userButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


function fecharMenuUsuario() {
    const userMenu =
        document.getElementById("userMenu");

    const userDropdown =
        document.getElementById("userDropdown");

    const userButton =
        document.getElementById("userButton");

    if (!userMenu || !userDropdown) {
        return;
    }

    userMenu.classList.remove("open");

    userDropdown.classList.add("hidden");
    userDropdown.classList.remove("show");

    userDropdown.setAttribute(
        "aria-hidden",
        "true"
    );

    if (userButton) {
        userButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

/* =========================================================
   SESSÃO
========================================================= */

async function verificarSessao() {
    const token =
        localStorage.getItem(TOKEN_KEY);

    if (!token) {
        atualizarInterfaceUsuario();
        return;
    }

    try {
        const resposta =
            await fetch(
                `${API_URL}/auth/me`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!resposta.ok) {
            localStorage.removeItem(TOKEN_KEY);

            usuarioAtual = null;

            atualizarInterfaceUsuario();

            return;
        }

        const dados =
            await resposta.json();

        usuarioAtual =
            dados.usuario || dados;

        atualizarInterfaceUsuario();

        await carregarFavoritos();

    } catch (erro) {
        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        usuarioAtual = null;

        atualizarInterfaceUsuario();
    }
}


function atualizarInterfaceUsuario() {
    const loginButton =
        document.getElementById("loginButton");

    const userMenu =
        document.getElementById("userMenu");

    const userDropdown =
        document.getElementById("userDropdown");

    const userName =
        document.getElementById("userName");

    const userDropdownName =
        document.getElementById("userDropdownName");


    if (usuarioAtual) {
        const nome =
            usuarioAtual.nome ||
            usuarioAtual.email ||
            "Usuário";

        if (loginButton) {
            loginButton.style.display = "none";
        }

        if (userMenu) {
            userMenu.style.display = "block";
            userMenu.classList.remove("open");
        }

        if (userDropdown) {
            userDropdown.classList.add("hidden");
            userDropdown.classList.remove("show");

            userDropdown.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (userName) {
            userName.textContent = nome;
        }

        if (userDropdownName) {
            userDropdownName.textContent = nome;
        }

    } else {

        if (loginButton) {
            loginButton.style.display = "flex";
        }

        if (userMenu) {
            userMenu.style.display = "none";
            userMenu.classList.remove("open");
        }

        if (userDropdown) {
            userDropdown.classList.add("hidden");
            userDropdown.classList.remove("show");

            userDropdown.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    }
}

/* =========================================================
   PRODUTOS
========================================================= */

async function carregarProdutos() {
    const loading =
        document.getElementById("loading");

    try {
        if (loading) {
            loading.style.display = "flex";
        }

        const resposta =
            await fetch(
                `${API_URL}/produtos`
            );

        if (!resposta.ok) {
            throw new Error(
                "Erro ao carregar produtos."
            );
        }

        const dados =
            await resposta.json();

        produtos =
            Array.isArray(dados)
                ? dados
                : dados.produtos || [];

        produtos =
            produtos.map(
                normalizarProduto
            );

            const lojas = [
    ...new Set(
        produtos.flatMap(produto =>
            Array.isArray(produto.precos)
                ? produto.precos.map(preco => preco.loja)
                : []
        )
    )
].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
);

const storeFilterSelect =
    document.getElementById("storeFilterSelect");

if (storeFilterSelect) {
    storeFilterSelect.innerHTML =
        `<option value="todas">Todas as lojas</option>`;

    lojas.forEach(loja => {
        const option =
            document.createElement("option");

        option.value = loja;
        option.textContent = loja;

        storeFilterSelect.appendChild(option);
    });
}

        aplicarFiltros();

    } catch (erro) {
        console.error(erro);

        mostrarToast(
            "Não foi possível carregar os produtos."
        );

    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}


function normalizarProduto(produto) {
    const precos =
        Array.isArray(produto.precos)
            ? produto.precos
            : [];

    let menorPreco =
        Number(
            produto.menor_preco
        );

    if (
        !Number.isFinite(menorPreco) &&
        precos.length
    ) {
        const valores =
            precos
                .map(
                    item =>
                        Number(item.preco)
                )
                .filter(
                    Number.isFinite
                );

        if (valores.length) {
            menorPreco =
                Math.min(...valores);
        }
    }

    if (!Number.isFinite(menorPreco)) {
        menorPreco = null;
    }

    return {
        ...produto,

        id:
            Number(produto.id),

        nome:
            produto.nome ||
            "Produto sem nome",

        categoria:
            produto.categoria ||
            "Outros",

        descricao:
            produto.descricao ||
            "",

        imagem:
            typeof produto.imagem === "string"
                ? produto.imagem.trim()
                : "",

        menor_preco:
            menorPreco,

        precos
    };
}

/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltros() {
    let lista =
        [...produtos];


        const minPrice =
    Number(document.getElementById("minPriceInput")?.value || 0);

const maxPrice =
    Number(document.getElementById("maxPriceInput")?.value || Infinity);

const storeFilter =
    document.getElementById("storeFilterSelect")?.value || "todas";

    if (storeFilter !== "todas") {
    lista = lista.filter(produto => {
        return Array.isArray(produto.precos) &&
            produto.precos.some(preco =>
                preco.loja === storeFilter
            );
    });
}

    if (categoriaAtual !== "Todos") {
        lista =
            lista.filter(
                produto =>
                    produto.categoria ===
                    categoriaAtual
            );
    }

    if (pesquisaAtual) {
        const termo =
            pesquisaAtual.toLowerCase();

        lista =
            lista.filter(
                produto => {
                    const nome =
                        String(
                            produto.nome || ""
                        ).toLowerCase();

                    const descricao =
                        String(
                            produto.descricao || ""
                        ).toLowerCase();

                    const categoria =
                        String(
                            produto.categoria || ""
                        ).toLowerCase();

                    return (
                        nome.includes(termo) ||
                        descricao.includes(termo) ||
                        categoria.includes(termo)
                    );
                }
            );
    }

    lista = lista.filter(produto => {
    const preco = Number(produto.menor_preco ?? 0);

    const dentroDoPreco =
        preco >= minPrice &&
        preco <= maxPrice;

    return dentroDoPreco;
});

    if (ordenacaoAtual === "menor-preco") {
        lista.sort(
            (a, b) =>
                (a.menor_preco ?? Infinity) -
                (b.menor_preco ?? Infinity)
        );

    } else if (ordenacaoAtual === "maior-preco") {
        lista.sort(
            (a, b) =>
                (b.menor_preco ?? -Infinity) -
                (a.menor_preco ?? -Infinity)
        );

    } else if (ordenacaoAtual === "nome") {
        lista.sort(
            (a, b) =>
                a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                )
        );
    }

    produtosFiltrados =
        lista;

    renderizarProdutos();

    atualizarContador();

    const favoritesPage =
        document.getElementById(
            "favoritesPage"
        );

    if (
        favoritesPage &&
        !favoritesPage.classList.contains("hidden")
    ) {
        renderizarPaginaFavoritos();
    }
}


function renderizarProdutos() {
    const grid =
        document.getElementById("productsGrid");

    const empty =
        document.getElementById("emptyState");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (!produtosFiltrados.length) {

        if (empty) {
            empty.classList.remove("hidden");
        }

        return;
    }

    if (empty) {
        empty.classList.add("hidden");
    }

    produtosFiltrados.forEach(
        produto => {
            grid.appendChild(
                criarCardProduto(produto)
            );
        }
    );
}

/* =========================================================
   IMAGENS
========================================================= */

function obterImagemProduto(produto) {
    if (
        produto &&
        typeof produto.imagem === "string"
    ) {
        const imagem =
            produto.imagem.trim();

        if (
            imagem &&
            imagem !== "null" &&
            imagem !== "undefined"
        ) {
            return imagem;
        }
    }

    return gerarImagemFallback(
        produto?.nome || "Produto"
    );
}


function configurarImagem(img, nome) {
    if (!img) {
        return;
    }

    const fallback =
        gerarImagemFallback(nome);

    img.dataset.fallback =
        fallback;

    img.addEventListener(
        "error",
        function () {
            if (
                img.dataset.fallbackUsado ===
                "true"
            ) {
                return;
            }

            img.dataset.fallbackUsado =
                "true";

            img.src =
                fallback;
        }
    );

    img.addEventListener(
        "load",
        function () {
            img.classList.add("loaded");
        }
    );
}


function criarCardProduto(produto) {
    const card =
        document.createElement("article");

    card.className =
        "product-card";

    const favorito =
        favoritos.has(produto.id);

    const preco =
        produto.menor_preco;

    const imagem =
        obterImagemProduto(produto);

    card.innerHTML = `
        <div class="product-image-wrapper">

            <img
                class="product-image"
                src="${escaparHTML(imagem)}"
                alt="${escaparHTML(produto.nome)}"
                loading="lazy"
                decoding="async"
            >

            <button
    class="favorite-btn ${
        favorito ? "active" : ""
    }"
    type="button"
    aria-label="${
        favorito
            ? "Remover dos favoritos"
            : "Favoritar produto"
    }"
>
    <span class="favorite-icon">
        ${
            favorito
                ? "♥"
                : "♡"
        }
    </span>
</button>

        </div>

        <div class="product-info">

            <div class="product-category">
                ${escaparHTML(produto.categoria)}
            </div>

            <h3 class="product-name">
                ${escaparHTML(produto.nome)}
            </h3>

            <p class="product-description">
                ${escaparHTML(produto.descricao)}
            </p>

            <div class="product-price">

                <small>
                    A partir de
                </small>

                <strong>
                    ${
                        preco !== null
                            ? formatarMoeda(preco)
                            : "Preço indisponível"
                    }
                </strong>

            </div>

            <button
    class="view-product-btn"
    type="button"
>
    Ver preços
    <span class="view-product-arrow">→</span>
</button>
        </div>
    `;

    const imagemElemento =
        card.querySelector(
            ".product-image"
        );

    configurarImagem(
        imagemElemento,
        produto.nome
    );

    const favoriteButton =
        card.querySelector(
            ".favorite-btn"
        );

    if (favoriteButton) {
        favoriteButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                alternarFavorito(
                    produto.id,
                    event
                );
            }
        );
    }

    card.addEventListener(
        "click",
        function () {
            abrirProduto(
                produto.id
            );
        }
    );

    return card;
}


function atualizarContador() {
    const contador =
        document.getElementById(
            "resultsCount"
        );

    if (!contador) {
        return;
    }

    contador.textContent =
        `${produtosFiltrados.length} ${
            produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"
        }`;
}

/* =========================================================
   CATEGORIAS
========================================================= */

async function carregarCategorias() {
    try {
        const resposta =
            await fetch(
                `${API_URL}/categorias`
            );

        if (!resposta.ok) {
            throw new Error(
                "Erro ao carregar categorias."
            );
        }

        const dados =
            await resposta.json();

        categorias =
            Array.isArray(dados)
                ? dados
                : dados.categorias || [];

        renderizarCategorias();

    } catch (erro) {
        console.error(erro);
    }
}


function renderizarCategorias() {
    const container =
        document.getElementById(
            "categories"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const lista = [
        "Todos",
        ...categorias.filter(
            categoria =>
                categoria !== "Todos"
        )
    ];

    lista.forEach(
        categoria => {
            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "category-button";

            if (
                categoria ===
                categoriaAtual
            ) {
                button.classList.add(
                    "active"
                );
            }

            button.dataset.category =
                categoria;

            button.textContent =
                categoria;

            button.addEventListener(
                "click",
                function () {
                    categoriaAtual =
                        categoria;

                    container
                        .querySelectorAll(
                            ".category-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    aplicarFiltros();
                }
            );

            container.appendChild(
                button
            );
        }
    );
}

/* =========================================================
   NAVEGAÇÃO DAS PÁGINAS
========================================================= */

function mostrarPaginaInicial() {
    const homePage =
        document.getElementById(
            "homePage"
        );

    const productPage =
        document.getElementById(
            "productPage"
        );

    const alertsPage =
        document.getElementById(
            "alertsPage"
        );

    const favoritesPage =
        document.getElementById(
            "favoritesPage"
        );

    const footer =
        document.getElementById(
            "siteFooter"
        );

    fecharMenuUsuario();

    if (homePage) {
        homePage.classList.remove("hidden");
    }

    if (productPage) {
        productPage.classList.add("hidden");
    }

    if (alertsPage) {
        alertsPage.classList.add("hidden");
    }

    if (favoritesPage) {
        favoritesPage.classList.add("hidden");
    }

    if (footer) {
        footer.style.display = "";
    }

    produtoAtual = null;
}


function voltarParaProdutos() {
    window.history.pushState(
        {},
        "",
        "/"
    );

    mostrarPaginaInicial();

    categoriaAtual =
        "Todos";

    pesquisaAtual =
        "";

    sincronizarBuscaPrincipal();

    renderizarCategorias();

    aplicarFiltros();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   PÁGINA DO PRODUTO
========================================================= */

function verificarPaginaProduto() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const produtoId =
        params.get("produto");

    const favoritosParametro =
        params.get("favoritos");

    const alertasParametro =
        params.get("alertas");

    if (favoritosParametro === "true") {
        abrirFavoritos(false);
        return;
    }

    if (alertasParametro === "true") {
        abrirPaginaAlertas(false);
        return;
    }

    if (produtoId) {
        abrirPaginaProduto(
            produtoId,
            false
        );
    } else {
        mostrarPaginaInicial();
    }
}


/*
    CORREÇÃO IMPORTANTE:

    O restante do sistema utilizava abrirProduto(),
    mas essa função não existia no arquivo.

    Agora ela simplesmente abre a página do produto.
*/
function abrirProduto(produtoId) {
    abrirPaginaProduto(
        produtoId,
        true
    );
}


async function abrirPaginaProduto(
    produtoId,
    atualizarURL = true
) {
    const id =
        Number(produtoId);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        mostrarPaginaInicial();
        return;
    }

    if (atualizarURL) {
        const novaURL =
            `/?produto=${id}`;

        window.history.pushState(
            {
                produtoId: id
            },
            "",
            novaURL
        );
    }

    const homePage =
        document.getElementById(
            "homePage"
        );

    const productPage =
        document.getElementById(
            "productPage"
        );

    const alertsPage =
        document.getElementById(
            "alertsPage"
        );

    const favoritesPage =
        document.getElementById(
            "favoritesPage"
        );

    const footer =
        document.getElementById(
            "siteFooter"
        );

    const loading =
        document.getElementById(
            "productPageLoading"
        );

    const content =
        document.getElementById(
            "productPageContent"
        );

    if (
        !productPage ||
        !content
    ) {
        return;
    }

    produtoAtual =
        id;

    fecharMenuUsuario();

    if (homePage) {
        homePage.classList.add("hidden");
    }

    if (alertsPage) {
        alertsPage.classList.add("hidden");
    }

    if (favoritesPage) {
        favoritesPage.classList.add("hidden");
    }

    productPage.classList.remove(
        "hidden"
    );

    if (footer) {
        footer.style.display = "none";
    }

    if (loading) {
        loading.style.display = "flex";
    }

    content.innerHTML = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    try {
        const respostaProduto =
            await fetch(
                `${API_URL}/produtos/${id}`
            );

        if (!respostaProduto.ok) {
            throw new Error(
                "Produto não encontrado."
            );
        }

        const produto =
            normalizarProduto(
                await respostaProduto.json()
            );

        let historico = null;

        try {
            const respostaHistorico =
                await fetch(
                    `${API_URL}/produtos/${id}/historico`
                );

            if (respostaHistorico.ok) {
                historico =
                    await respostaHistorico.json();
            }

        } catch (erroHistorico) {
            console.warn(
                "Histórico indisponível:",
                erroHistorico
            );
        }

        renderizarPaginaProduto(
            produto,
            historico
        );

    } catch (erro) {
        console.error(erro);

        content.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Não foi possível carregar o produto
                </h3>

                <p>
                    Tente novamente ou volte para a lista de produtos.
                </p>

                <button
                    type="button"
                    onclick="voltarParaProdutos()"
                >
                    Voltar para produtos
                </button>

            </div>
        `;

    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}


function renderizarPaginaProduto(
    produto,
    historico
) {
    const content =
        document.getElementById(
            "productPageContent"
        );

    if (!content) {
        return;
    }

    produtoAtual =
        produto.id;

    const menorPreco =
        encontrarMenorPrecoAtual(
            produto
        );

    const lojaMenorPreco =
        encontrarLojaMenorPreco(
            produto
        );

    const imagem =
        obterImagemProduto(
            produto
        );

    const favorito =
        favoritos.has(
            produto.id
        );

    content.innerHTML = `
        <section class="product-detail-top">

            <div class="product-detail-image-box">

                <img
                    class="product-detail-image"
                    src="${escaparHTML(imagem)}"
                    alt="${escaparHTML(produto.nome)}"
                    decoding="async"
                >

            </div>

            <div class="product-detail-info">

                <span class="product-detail-category">
                    ${escaparHTML(
                        produto.categoria
                    )}
                </span>

                <h1>
                    ${escaparHTML(
                        produto.nome
                    )}
                </h1>

                <p class="product-detail-description">
                    ${escaparHTML(
                        produto.descricao ||
                        "Confira os preços disponíveis para este produto."
                    )}
                </p>

                <div class="best-price-box">

                    <span class="best-price-label">
                        Menor preço encontrado
                    </span>

                    <strong class="best-price-value">
                        ${
                            menorPreco !== null
                                ? formatarMoeda(
                                    menorPreco
                                )
                                : "Preço indisponível"
                        }
                    </strong>

                    <span class="best-price-store">
                        ${
                            lojaMenorPreco
                                ? `Na ${escaparHTML(
                                    lojaMenorPreco
                                )}`
                                : "Loja não informada"
                        }
                    </span>

                </div>

                ${criarAvaliacaoPreco(
                    menorPreco,
                    historico
                )}

                <button
                    type="button"
                    id="productFavoriteButton"
                    class="product-favorite-button ${
                        favorito ? "active" : ""
                    }"
                >
                    ${
                        favorito
                            ? "♥ Remover dos favoritos"
                            : "♡ Adicionar aos favoritos"
                    }
                </button>

            </div>

        </section>

        ${criarSecaoAlertaPreco(
            produto,
            menorPreco
        )}

        ${criarSecaoComparacaoPrecos(
            produto
        )}

        ${
            historico &&
            Array.isArray(
                historico.historico
            ) &&
            historico.historico.length
                ? criarSecaoHistoricoPagina(
                    historico
                )
                : ""
        }
    `;

    const imagemElemento =
        content.querySelector(
            ".product-detail-image"
        );

    configurarImagem(
        imagemElemento,
        produto.nome
    );

    const favoriteButton =
        document.getElementById(
            "productFavoriteButton"
        );

    if (favoriteButton) {
        favoriteButton.addEventListener(
            "click",
            function () {
                alternarFavorito(
                    produto.id
                );
            }
        );
    }

    configurarFormularioAlerta(
        produto,
        menorPreco
    );

    preencherAlertaExistente(
        produto.id
    );
}

/* =========================================================
   VALE A PENA COMPRAR?
========================================================= */

function criarAvaliacaoPreco(
    precoAtual,
    historico
) {
    const avaliacao =
        avaliarPrecoAtual(
            precoAtual,
            historico
        );

    if (!avaliacao) {
        return "";
    }

    return `
        <div class="price-verdict ${escaparHTML(
            avaliacao.classe
        )}">

            <strong>
                ${escaparHTML(
                    avaliacao.titulo
                )}
            </strong>

            <span>
                ${escaparHTML(
                    avaliacao.texto
                )}
            </span>

        </div>
    `;
}


function avaliarPrecoAtual(
    precoAtual,
    historico
) {
    const atual =
        Number(precoAtual);

    const estatisticas =
        historico &&
        historico.estatisticas
            ? historico.estatisticas
            : {};

    const menor =
        Number(
            estatisticas.menor_preco
        );

    const medio =
        Number(
            estatisticas.preco_medio
        );

    if (
        !Number.isFinite(atual) ||
        !Number.isFinite(menor)
    ) {
        return null;
    }

    if (atual <= menor * 1.03) {
        return {
            classe: "good",
            titulo: "Bom momento para comprar",
            texto:
                "O preço atual está perto do menor valor já registrado."
        };
    }

    if (
        Number.isFinite(medio) &&
        atual > medio * 1.08
    ) {
        return {
            classe: "high",
            titulo: "Já esteve mais barato",
            texto:
                `O menor preço registrado foi ${formatarMoeda(
                    menor
                )}. Pode valer esperar um alerta.`
        };
    }

    return {
        classe: "mid",
        titulo: "Preço na média",
        texto:
            `Já chegou a ${formatarMoeda(
                menor
            )}. Se não for urgente, acompanhe um pouco mais.`
    };
}

/* =========================================================
   ALERTA DE PREÇO
========================================================= */

function criarSecaoAlertaPreco(
    produto,
    menorPreco
) {
    return `
        <section class="price-alert-box">

            <div class="price-alert-title">
                🔔 Receba um alerta de preço
            </div>

            <p class="price-alert-description">
                Defina quanto você gostaria de pagar. Se já existir
                um alerta neste produto, o valor será atualizado.
            </p>

            <div class="price-alert-form">

                <input
                    type="number"
                    id="priceAlertInput"
                    class="price-alert-input"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex.: 1999,90"
                    aria-label="Preço desejado"
                >

                <button
                    type="button"
                    id="priceAlertButton"
                    class="price-alert-button"
                >
                    🔔 Criar alerta
                </button>

            </div>

            <div class="price-alert-current">
                ${
                    menorPreco !== null
                        ? `Menor preço atual: <strong>${formatarMoeda(
                            menorPreco
                        )}</strong>`
                        : "Preço atual indisponível."
                }
            </div>

            <div
                id="priceAlertMessage"
                class="price-alert-success"
                style="display: none;"
            ></div>

        </section>
    `;
}


function configurarFormularioAlerta(
    produto,
    menorPreco
) {
    const input =
        document.getElementById(
            "priceAlertInput"
        );

    const button =
        document.getElementById(
            "priceAlertButton"
        );

    if (!input || !button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {
            criarAlertaPreco(
                produto.id,
                input.value,
                menorPreco
            );
        }
    );

    input.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Enter") {
                criarAlertaPreco(
                    produto.id,
                    input.value,
                    menorPreco
                );
            }
        }
    );
}


async function preencherAlertaExistente(
    produtoId
) {
    if (!usuarioAtual) {
        return;
    }

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    if (!token) {
        return;
    }

    try {
        const resposta =
            await fetch(
                `${API_URL}/alertas`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!resposta.ok) {
            return;
        }

        const dados =
            await resposta.json();

        const alertas =
            Array.isArray(dados)
                ? dados
                : dados.alertas || [];

        const alerta =
            alertas.find(
                item =>
                    Number(
                        item.produto_id
                    ) ===
                    Number(produtoId) &&
                    Number(item.ativo) === 1
            );

        if (!alerta) {
            return;
        }

        const input =
            document.getElementById(
                "priceAlertInput"
            );

        const button =
            document.getElementById(
                "priceAlertButton"
            );

        if (
            input &&
            Number.isFinite(
                Number(
                    alerta.preco_alvo
                )
            )
        ) {
            input.value =
                Number(
                    alerta.preco_alvo
                ).toFixed(2);
        }

        if (button) {
            button.textContent =
                "🔔 Atualizar alerta";
        }

    } catch (erro) {
        console.warn(
            "Não foi possível carregar o alerta deste produto:",
            erro
        );
    }
}


async function criarAlertaPreco(
    produtoId,
    valorInformado,
    menorPreco
) {
    if (!usuarioAtual) {
        alertaPendente = {
            produtoId:
                Number(produtoId),

            precoAlvo:
                Number(
                    String(
                        valorInformado
                    ).replace(
                        ",",
                        "."
                    )
                )
        };

        mostrarToast(
            "Entre na sua conta para criar um alerta."
        );

        abrirAuthModal();

        return;
    }

    const precoAlvo =
        Number(
            String(
                valorInformado
            ).replace(
                ",",
                "."
            )
        );

    if (
        !Number.isFinite(
            precoAlvo
        ) ||
        precoAlvo <= 0
    ) {
        mostrarToast(
            "Digite um preço válido."
        );

        return;
    }

    if (
        menorPreco !== null &&
        Number.isFinite(
            Number(menorPreco)
        ) &&
        precoAlvo >=
            Number(menorPreco)
    ) {
        mostrarToast(
            "O preço desejado precisa ser menor que o menor preço atual."
        );

        return;
    }

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    const button =
        document.getElementById(
            "priceAlertButton"
        );

    const message =
        document.getElementById(
            "priceAlertMessage"
        );

    if (button) {
        button.disabled = true;
        button.textContent = "Criando...";
    }

    try {
        const resposta =
            await fetch(
                `${API_URL}/alertas`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            produto_id:
                                Number(
                                    produtoId
                                ),

                            preco_alvo:
                                precoAlvo
                        })
                }
            );

        const dados =
            await resposta
                .json()
                .catch(
                    () => ({})
                );

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível criar o alerta."
            );
        }

        if (message) {
            message.textContent =
                dados.atualizado
                    ? `Alerta atualizado para ${formatarMoeda(
                        precoAlvo
                    )}.`
                    : `Alerta criado! Vamos acompanhar este produto até ele chegar a ${formatarMoeda(
                        precoAlvo
                    )}.`;

            message.style.display =
                "block";
        }

        const input =
            document.getElementById(
                "priceAlertInput"
            );

        if (input) {
            input.value = "";
        }

        mostrarToast(
            dados.atualizado
                ? "Alerta atualizado."
                : "Alerta de preço criado com sucesso!"
        );

    } catch (erro) {
        console.error(erro);

        mostrarToast(
            erro.message ||
            "Não foi possível criar o alerta."
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "🔔 Atualizar alerta";
        }
    }
}

/* =========================================================
   ALERTAS
========================================================= */

async function carregarAlertas() {
    const loading =
        document.getElementById(
            "alertsLoading"
        );

    const list =
        document.getElementById(
            "alertsList"
        );

    const empty =
        document.getElementById(
            "alertsEmpty"
        );

    if (!usuarioAtual) {
        if (loading) {
            loading.style.display =
                "none";
        }

        if (list) {
            list.innerHTML = "";
        }

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    if (loading) {
        loading.style.display =
            "flex";
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    try {
        const token =
            localStorage.getItem(
                TOKEN_KEY
            );

        const resposta =
            await fetch(
                `${API_URL}/alertas`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!resposta.ok) {
            const dados =
                await resposta
                    .json()
                    .catch(
                        () => ({})
                    );

            throw new Error(
                dados.erro ||
                "Não foi possível carregar seus alertas."
            );
        }

        const dados =
            await resposta.json();

        const alertas =
            Array.isArray(dados)
                ? dados
                : dados.alertas || [];

        renderizarAlertas(
            alertas
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar alertas:",
            erro
        );

        if (list) {
            list.innerHTML = `
                <div class="alerts-empty">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Não foi possível carregar seus alertas
                    </h3>

                    <p>
                        Tente novamente em alguns instantes.
                    </p>

                </div>
            `;
        }

    } finally {
        if (loading) {
            loading.style.display =
                "none";
        }
    }
}


function renderizarAlertas(
    alertas
) {
    const list =
        document.getElementById(
            "alertsList"
        );

    const empty =
        document.getElementById(
            "alertsEmpty"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (!alertas.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    alertas.forEach(
        alerta => {
            list.appendChild(
                criarCardAlerta(
                    alerta
                )
            );
        }
    );
}


function criarCardAlerta(
    alerta
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "alert-card";

    const produtoNome =
        alerta.produto_nome ||
        alerta.nome ||
        "Produto";

    const imagem =
        alerta.produto_imagem ||
        alerta.imagem ||
        gerarImagemFallback(
            produtoNome
        );

    const precoAtual =
        Number(
            alerta.preco_atual ??
            alerta.menor_preco_atual
        );

    const precoAlvo =
        Number(
            alerta.preco_alvo
        );

    const atingido =
        Boolean(
            alerta.atingido_em ||
            alerta.ativo === 0 ||
            alerta.ativo === false
        );

    const valoresValidos =
        Number.isFinite(precoAtual) &&
        Number.isFinite(precoAlvo) &&
        precoAtual > 0 &&
        precoAlvo > 0;

    const diferenca =
        valoresValidos
            ? precoAtual - precoAlvo
            : null;

    const percentualFaltante =
        valoresValidos &&
        precoAtual > precoAlvo
            ? Math.round(
                (
                    diferenca /
                    precoAtual
                ) * 100
            )
            : 0;

    const progresso =
        valoresValidos
            ? Math.min(
                100,
                Math.max(
                    0,
                    Math.round(
                        (
                            precoAlvo /
                            precoAtual
                        ) * 100
                    )
                )
            )
            : 0;

    let informacaoAlerta = "";

    if (atingido) {
        if (
            valoresValidos &&
            precoAtual < precoAlvo
        ) {
            const economia =
                precoAlvo - precoAtual;

            informacaoAlerta = `
                <div class="alert-gap">
                    🎯 Você economiza
                    <strong>
                        ${formatarMoeda(
                            economia
                        )}
                    </strong>
                    em relação ao seu objetivo.
                </div>
            `;
        } else {
            informacaoAlerta = `
                <div class="alert-gap">
                    🎯 Seu objetivo de preço foi alcançado.
                </div>
            `;
        }

    } else if (
        diferenca !== null &&
        diferenca > 0
    ) {
        informacaoAlerta = `
            <div class="alert-gap">
                Faltam
                <strong>
                    ${formatarMoeda(
                        diferenca
                    )}
                </strong>

                ${
                    percentualFaltante > 0
                        ? `(${percentualFaltante}% de queda)`
                        : ""
                }
            </div>

            <div
                class="alert-progress"
                aria-label="Progresso até o preço desejado"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${progresso}"
            >
                <span
                    style="width: ${progresso}%"
                ></span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="alert-product-image">

            <img
                src="${escaparHTML(imagem)}"
                alt="${escaparHTML(produtoNome)}"
                loading="lazy"
                decoding="async"
            >

        </div>

        <div class="alert-card-content">

            <div class="alert-product-name">
                ${escaparHTML(
                    produtoNome
                )}
            </div>

            <div class="alert-product-price">
                ${
                    Number.isFinite(
                        precoAtual
                    )
                        ? `Preço atual: <strong>${formatarMoeda(
                            precoAtual
                        )}</strong>`
                        : "Preço atual: indisponível"
                }
            </div>

            <div class="alert-target-price">
                Seu objetivo:

                <strong>
                    ${formatarMoeda(
                        precoAlvo
                    )}
                </strong>
            </div>

            ${informacaoAlerta}

            <div class="alert-status ${
                atingido
                    ? "reached"
                    : "active"
            }">
                ${
                    atingido
                        ? "✓ Preço atingido"
                        : "● Monitorando preço"
                }
            </div>

            <button
    type="button"
    class="alert-delete-button"
    aria-label="Excluir alerta de ${escaparHTML(
        produtoNome
    )}"
>
    <span class="alert-delete-icon">🗑️</span>
    <span>Excluir alerta</span>
</button>
        </div>
    `;

    const imagemElemento =
        card.querySelector(
            ".alert-product-image img"
        );

    configurarImagem(
        imagemElemento,
        produtoNome
    );

    const deleteButton =
        card.querySelector(
            ".alert-delete-button"
        );

    if (deleteButton) {
        deleteButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                excluirAlerta(
                    alerta.id,
                    deleteButton
                );
            }
        );
    }

    card.addEventListener(
        "click",
        function (event) {
            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            const produtoId =
                Number(
                    alerta.produto_id
                );

            if (
                Number.isInteger(
                    produtoId
                ) &&
                produtoId > 0
            ) {
                abrirProduto(
                    produtoId
                );
            }
        }
    );

    return card;
}


async function excluirAlerta(
    alertaId,
    button = null
) {
    if (!usuarioAtual) {
        abrirAuthModal();
        return;
    }

    if (
        button &&
        button.disabled
    ) {
        return;
    }

    const confirmar =
        window.confirm(
            "Tem certeza que deseja excluir este alerta?"
        );

    if (!confirmar) {
        return;
    }

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    const textoOriginal =
        button
            ? button.textContent
            : "";

    if (button) {
        button.disabled = true;
        button.textContent =
            "Excluindo...";
    }

    try {
        const resposta =
            await fetch(
                `${API_URL}/alertas/${Number(
                    alertaId
                )}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const dados =
            await resposta
                .json()
                .catch(
                    () => ({})
                );

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível excluir o alerta."
            );
        }

        mostrarToast(
            "Alerta excluído."
        );

        await carregarAlertas();

    } catch (erro) {
        console.error(erro);

        if (button) {
            button.disabled = false;
            button.textContent =
                textoOriginal ||
                "🗑️ Excluir alerta";
        }

        mostrarToast(
            erro.message ||
            "Não foi possível excluir o alerta."
        );
    }
}


function abrirPaginaAlertas(
    atualizarURL = true
) {
    if (!usuarioAtual) {
        mostrarToast(
            "Entre na sua conta para acessar seus alertas."
        );

        abrirAuthModal();

        return;
    }

    fecharMenuUsuario();

    const homePage =
        document.getElementById(
            "homePage"
        );

    const productPage =
        document.getElementById(
            "productPage"
        );

    const alertsPage =
        document.getElementById(
            "alertsPage"
        );

    const favoritesPage =
        document.getElementById(
            "favoritesPage"
        );

    const footer =
        document.getElementById(
            "siteFooter"
        );

    if (!alertsPage) {
        return;
    }

    if (homePage) {
        homePage.classList.add(
            "hidden"
        );
    }

    if (productPage) {
        productPage.classList.add(
            "hidden"
        );
    }

    if (favoritesPage) {
        favoritesPage.classList.add(
            "hidden"
        );
    }

    alertsPage.classList.remove(
        "hidden"
    );

    if (footer) {
        footer.style.display =
            "none";
    }

    produtoAtual = null;

    if (atualizarURL) {
        window.history.pushState(
            {
                pagina: "alertas"
            },
            "",
            "/?alertas=true"
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    carregarAlertas();
}

/* =========================================================
   FAVORITOS
========================================================= */

async function carregarFavoritos() {
    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    if (!token) {
        favoritos = new Set();

        atualizarResumoFavoritos();

        return;
    }

    try {
        const resposta =
            await fetch(
                `${API_URL}/favoritos`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!resposta.ok) {
            return;
        }

        const dados =
            await resposta.json();

        const lista =
            Array.isArray(dados)
                ? dados
                : dados.favoritos || [];

        favoritos =
            new Set(
                lista
                    .map(
                        item =>
                            Number(
                                item.produto_id ??
                                item.id
                            )
                    )
                    .filter(
                        id =>
                            Number.isFinite(id)
                    )
            );

        atualizarBotaoFavoritoPagina();

        renderizarProdutos();

        atualizarResumoFavoritos();

        const favoritesPage =
            document.getElementById(
                "favoritesPage"
            );

        if (
            favoritesPage &&
            !favoritesPage.classList.contains(
                "hidden"
            )
        ) {
            renderizarPaginaFavoritos();
        }

    } catch (erro) {
        console.error(
            "Erro ao carregar favoritos:",
            erro
        );
    }
}


async function alternarFavorito(
    produtoId,
    event
) {
    if (event) {
        event.stopPropagation();
    }

    if (!usuarioAtual) {
        mostrarToast(
            "Entre na sua conta para salvar favoritos."
        );

        abrirAuthModal();

        return;
    }

    const id =
        Number(produtoId);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return;
    }

    const jaFavoritado =
        favoritos.has(id);

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    try {
        const resposta =
            await fetch(
                `${API_URL}/favoritos/${id}`,
                {
                    method:
                        jaFavoritado
                            ? "DELETE"
                            : "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (!resposta.ok) {
            const dados =
                await resposta
                    .json()
                    .catch(
                        () => ({})
                    );

            throw new Error(
                dados.erro ||
                "Não foi possível alterar o favorito."
            );
        }

        if (jaFavoritado) {
            favoritos.delete(id);

            mostrarToast(
                "Produto removido dos favoritos."
            );

        } else {
            favoritos.add(id);

            mostrarToast(
                "Produto adicionado aos favoritos."
            );
        }

        renderizarProdutos();

        atualizarBotaoFavoritoPagina();

        atualizarResumoFavoritos();

        const favoritesPage =
            document.getElementById(
                "favoritesPage"
            );

        if (
            favoritesPage &&
            !favoritesPage.classList.contains(
                "hidden"
            )
        ) {
            renderizarPaginaFavoritos();
        }

    } catch (erro) {
        console.error(erro);

        mostrarToast(
            erro.message ||
            "Não foi possível alterar o favorito."
        );
    }
}


function atualizarBotaoFavoritoPagina() {
    const button =
        document.getElementById(
            "productFavoriteButton"
        );

    if (
        !button ||
        !produtoAtual
    ) {
        return;
    }

    const ativo =
        favoritos.has(
            Number(produtoAtual)
        );

    button.classList.toggle(
        "active",
        ativo
    );

    button.textContent =
        ativo
            ? "♥ Remover dos favoritos"
            : "♡ Adicionar aos favoritos";
}


/* =========================================================
   CONTROLES DOS FAVORITOS
========================================================= */

function atualizarResumoFavoritos() {
    const total =
        favoritos.size;

    const count =
        document.getElementById(
            "favoritesCount"
        );

    const summaryCount =
        document.getElementById(
            "favoritesSummaryCount"
        );

    if (count) {
        count.textContent =
            `${total} ${
                total === 1
                    ? "produto"
                    : "produtos"
            }`;
    }

    if (summaryCount) {
        summaryCount.textContent =
            total;
    }
}


function atualizarBotaoLimparPesquisaFavoritos() {
    const input =
        document.getElementById(
            "favoritesSearchInput"
        );

    const button =
        document.getElementById(
            "clearFavoritesSearchButton"
        );

    if (!button) {
        return;
    }

    const temPesquisa =
        Boolean(
            (
                favoritosPesquisaAtual ||
                input?.value ||
                ""
            ).trim()
        );

    button.classList.toggle(
        "hidden",
        !temPesquisa
    );
}


function limparPesquisaFavoritos() {
    favoritosPesquisaAtual =
        "";

    const input =
        document.getElementById(
            "favoritesSearchInput"
        );

    if (input) {
        input.value = "";
    }

    atualizarBotaoLimparPesquisaFavoritos();

    renderizarPaginaFavoritos();
}


function obterProdutosFavoritos() {
    let lista =
        produtos.filter(
            produto =>
                favoritos.has(
                    Number(
                        produto.id
                    )
                )
        );

    if (favoritosPesquisaAtual) {
        const termo =
            favoritosPesquisaAtual
                .toLowerCase();

        lista =
            lista.filter(
                produto => {
                    const nome =
                        String(
                            produto.nome || ""
                        ).toLowerCase();

                    const categoria =
                        String(
                            produto.categoria || ""
                        ).toLowerCase();

                    const descricao =
                        String(
                            produto.descricao || ""
                        ).toLowerCase();

                    return (
                        nome.includes(termo) ||
                        categoria.includes(termo) ||
                        descricao.includes(termo)
                    );
                }
            );
    }

    if (
        favoritosOrdenacaoAtual ===
        "menor-preco"
    ) {
        lista.sort(
            (a, b) =>
                (
                    a.menor_preco ??
                    Infinity
                ) -
                (
                    b.menor_preco ??
                    Infinity
                )
        );

    } else if (
        favoritosOrdenacaoAtual ===
        "maior-preco"
    ) {
        lista.sort(
            (a, b) =>
                (
                    b.menor_preco ??
                    -Infinity
                ) -
                (
                    a.menor_preco ??
                    -Infinity
                )
        );

    } else if (
        favoritosOrdenacaoAtual ===
        "nome"
    ) {
        lista.sort(
            (a, b) =>
                a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                )
        );

    } else if (
        favoritosOrdenacaoAtual ===
        "recentes"
    ) {
        const ordemFavoritos =
            Array.from(
                favoritos
            );

        lista.sort(
            (a, b) =>
                ordemFavoritos.indexOf(
                    Number(b.id)
                ) -
                ordemFavoritos.indexOf(
                    Number(a.id)
                )
        );
    }

    return lista;
}


/* =========================================================
   PÁGINA DE FAVORITOS
========================================================= */

function abrirFavoritos(
    atualizarURL = true
) {
    if (!usuarioAtual) {
        mostrarToast(
            "Entre na sua conta para acessar seus favoritos."
        );

        abrirAuthModal();

        return;
    }

    fecharMenuUsuario();

    const homePage =
        document.getElementById(
            "homePage"
        );

    const productPage =
        document.getElementById(
            "productPage"
        );

    const alertsPage =
        document.getElementById(
            "alertsPage"
        );

    const favoritesPage =
        document.getElementById(
            "favoritesPage"
        );

    const footer =
        document.getElementById(
            "siteFooter"
        );

    if (!favoritesPage) {
        return;
    }

    if (homePage) {
        homePage.classList.add(
            "hidden"
        );
    }

    if (productPage) {
        productPage.classList.add(
            "hidden"
        );
    }

    if (alertsPage) {
        alertsPage.classList.add(
            "hidden"
        );
    }

    favoritesPage.classList.remove(
        "hidden"
    );

    if (footer) {
        footer.style.display =
            "none";
    }

    produtoAtual = null;

    /*
        Só altera o histórico quando o usuário
        realmente clicou em Favoritos.
        Ao usar o botão Voltar do navegador,
        não criaremos outra entrada.
    */
    if (atualizarURL) {
        window.history.pushState(
            {
                pagina: "favoritos"
            },
            "",
            "/?favoritos=true"
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    atualizarBotaoLimparPesquisaFavoritos();

    renderizarPaginaFavoritos();
}


function renderizarPaginaFavoritos() {
    const list =
        document.getElementById(
            "favoritesList"
        );

    const empty =
        document.getElementById(
            "favoritesEmpty"
        );

    const loading =
        document.getElementById(
            "favoritesLoading"
        );

    const count =
        document.getElementById(
            "favoritesCount"
        );

    const summaryCount =
        document.getElementById(
            "favoritesSummaryCount"
        );

    const emptyTitle =
        empty?.querySelector("h3");

    const emptyText =
        empty?.querySelector("p");

    const emptyButton =
        document.getElementById(
            "favoritesEmptyButton"
        );

    if (!list) {
        return;
    }

    if (loading) {
        loading.style.display =
            "none";
    }

    atualizarBotaoLimparPesquisaFavoritos();

    const totalFavoritos =
        favoritos.size;

    const produtosFavoritos =
        obterProdutosFavoritos();

    if (count) {
        count.textContent =
            `${totalFavoritos} ${
                totalFavoritos === 1
                    ? "produto"
                    : "produtos"
            }`;
    }

    if (summaryCount) {
        summaryCount.textContent =
            totalFavoritos;
    }

    list.innerHTML = "";

    /* =====================================================
       NENHUM FAVORITO CADASTRADO
    ===================================================== */

    if (!totalFavoritos) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        if (emptyTitle) {
            emptyTitle.textContent =
                "Você ainda não tem favoritos";
        }

        if (emptyText) {
            emptyText.textContent =
                "Salve produtos que você gostou para encontrá-los facilmente depois.";
        }

        if (emptyButton) {
            emptyButton.textContent =
                "Explorar produtos";
        }

        return;
    }


    /* =====================================================
       PESQUISA SEM RESULTADOS
    ===================================================== */

    if (!produtosFavoritos.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        if (emptyTitle) {
            emptyTitle.textContent =
                "Nenhum favorito encontrado";
        }

        if (emptyText) {
            emptyText.textContent =
                `Não encontramos nenhum produto para "${favoritosPesquisaAtual}".`;
        }

        if (emptyButton) {
            emptyButton.textContent =
                "Limpar pesquisa";
        }

        return;
    }


    /* =====================================================
       EXISTEM FAVORITOS
    ===================================================== */

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    produtosFavoritos.forEach(
        produto => {
            list.appendChild(
                criarCardFavorito(
                    produto
                )
            );
        }
    );
}


function criarCardFavorito(
    produto
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "favorite-page-card";

    const imagem =
        obterImagemProduto(
            produto
        );

    const preco =
        produto.menor_preco;

    card.innerHTML = `
        <div class="favorite-page-image">

            <img
                src="${escaparHTML(imagem)}"
                alt="${escaparHTML(produto.nome)}"
                loading="lazy"
                decoding="async"
            >

        </div>

        <div class="favorite-page-info">

            <span class="favorite-page-category">
                ${escaparHTML(
                    produto.categoria
                )}
            </span>

            <h3>
                ${escaparHTML(
                    produto.nome
                )}
            </h3>

            <p>
                ${escaparHTML(
                    produto.descricao ||
                    "Confira os preços disponíveis para este produto."
                )}
            </p>

            <div class="favorite-page-price">

                <small>
                    A partir de
                </small>

                <strong>
                    ${
                        preco !== null
                            ? formatarMoeda(
                                preco
                            )
                            : "Preço indisponível"
                    }
                </strong>

            </div>

        </div>

        <div class="favorite-page-actions">

            <button
                type="button"
                class="favorite-view-button"
            >
                Ver produto
            </button>

            <button
                type="button"
                class="favorite-remove-button"
                aria-label="Remover dos favoritos"
            >
                ♥
            </button>

        </div>
    `;

    const imagemElemento =
        card.querySelector(
            ".favorite-page-image img"
        );

    configurarImagem(
        imagemElemento,
        produto.nome
    );

    const viewButton =
        card.querySelector(
            ".favorite-view-button"
        );

    if (viewButton) {
        viewButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                abrirProduto(
                    produto.id
                );
            }
        );
    }

    const removeButton =
        card.querySelector(
            ".favorite-remove-button"
        );

    if (removeButton) {
        removeButton.addEventListener(
            "click",
            function (event) {
                event.stopPropagation();

                alternarFavorito(
                    produto.id
                );
            }
        );
    }

    card.addEventListener(
        "click",
        function (event) {
            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            abrirProduto(
                produto.id
            );
        }
    );

    return card;
}

/* =========================================================
   COMPARAÇÃO DE PREÇOS
========================================================= */

function criarSecaoComparacaoPrecos(produto) {
    const precos = Array.isArray(produto.precos)
        ? produto.precos
        : [];

    const precosValidos = precos
        .map(item => ({
            ...item,
            preco: Number(item.preco)
        }))
        .filter(item => Number.isFinite(item.preco));

    const precosOrdenados = [...precosValidos].sort(
        (a, b) => a.preco - b.preco
    );

    if (!precosOrdenados.length) {
        return `
            <section class="product-section-box">
                <div class="product-section-header">
                    <h2>
                        Comparar preços
                    </h2>
                    <p>
                        Ainda não existem preços cadastrados para este produto.
                    </p>
                </div>
            </section>
        `;
    }

    const menorPreco = precosOrdenados[0].preco;
    const lojaMenorPreco =
        precosOrdenados[0].loja || "Loja";

    return `
        <section class="product-section-box">
            <div class="product-section-header">
                <h2>
                    Comparar preços
                </h2>
                <p>
                    Encontramos ${precosOrdenados.length}
                    ${
                        precosOrdenados.length === 1
                            ? "loja"
                            : "lojas"
                    }
                    para este produto.
                </p>
            </div>

            <div class="store-list-page">
                ${precosOrdenados
                    .map(
                        (item, index) =>
                            criarItemLojaPagina(
                                item,
                                index === 0,
                                menorPreco
                            )
                    )
                    .join("")}
            </div>

            <div class="store-date-page" style="margin-top: 14px;">
                Menor preço encontrado:
                <strong>
                    ${formatarMoeda(menorPreco)}
                </strong>
                em
                <strong>
                    ${escaparHTML(lojaMenorPreco)}
                </strong>
            </div>
        </section>
    `;
}

function criarItemLojaPagina(
    item,
    ehMelhor,
    menorPreco
) {
    const preco = Number(item.preco);
    const diferenca = preco - menorPreco;

    const url =
        typeof item.url === "string"
            ? item.url.trim()
            : "";

    return `
        <div class="store-item-page">
            <div>
                <div class="store-name-page">
                    ${escaparHTML(
                        item.loja || "Loja"
                    )}
                </div>

                <span class="store-date-page">
                    ${
                        item.data
                            ? `Atualizado em ${formatarData(
                                  item.data
                              )}`
                            : "Data não informada"
                    }
                </span>

                ${
                    !ehMelhor && diferenca > 0
                        ? `
                            <span class="store-date-page">
                                ${formatarMoeda(
                                    diferenca
                                )}
                                mais caro
                            </span>
                        `
                        : ""
                }
            </div>

            <strong class="store-price-page">
                ${formatarMoeda(preco)}
            </strong>

            ${
                ehMelhor
                    ? `
                        <span class="store-best-badge">
                            MENOR PREÇO
                        </span>
                    `
                    : ""
            }

            ${
                url
                    ? `
                        <a
                            class="store-link-page"
                            href="${escaparHTML(url)}"
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                        >
                            Ir para loja →
                        </a>
                    `
                    : ""
            }
        </div>
    `;
}

/* =========================================================
   HISTÓRICO
========================================================= */

function criarSecaoHistoricoPagina(
    historico
) {
    const estatisticas =
        historico.estatisticas ||
        {};

    const registros =
        historico.historico ||
        [];

    return `
        <section class="product-section-box">

            <div class="product-section-header">

                <h2>
                    Histórico de preços
                </h2>

                <p>
                    Veja como os preços registrados deste produto variaram ao longo do tempo.
                </p>

            </div>

            <div class="history-stats">

                <div class="history-stat">

                    <small>
                        Menor preço
                    </small>

                    <strong>
                        ${
                            estatisticas.menor_preco !== null &&
                            estatisticas.menor_preco !== undefined
                                ? formatarMoeda(
                                    Number(
                                        estatisticas.menor_preco
                                    )
                                )
                                : "—"
                        }
                    </strong>

                </div>

                <div class="history-stat">

                    <small>
                        Maior preço
                    </small>

                    <strong>
                        ${
                            estatisticas.maior_preco !== null &&
                            estatisticas.maior_preco !== undefined
                                ? formatarMoeda(
                                    Number(
                                        estatisticas.maior_preco
                                    )
                                )
                                : "—"
                        }
                    </strong>

                </div>

                <div class="history-stat">

                    <small>
                        Preço médio
                    </small>

                    <strong>
                        ${
                            estatisticas.preco_medio !== null &&
                            estatisticas.preco_medio !== undefined
                                ? formatarMoeda(
                                    Number(
                                        estatisticas.preco_medio
                                    )
                                )
                                : "—"
                        }
                    </strong>

                </div>

                <div class="history-stat">

                    <small>
                        Registros
                    </small>

                    <strong>
                        ${
                            estatisticas.quantidade_registros ||
                            registros.length
                        }
                    </strong>

                </div>

            </div>

            ${criarGraficoHistorico(
                registros
            )}

        </section>
    `;
}


function criarGraficoHistorico(
    registros
) {
    if (!registros.length) {
        return "";
    }

    const dados =
        registros
            .map(item => ({
                preco: Number(item.preco),
                data: item.data
            }))
            .filter(
                item =>
                    Number.isFinite(item.preco)
            )
            .slice(-20);

    if (!dados.length) {
        return "";
    }

    const valores =
        dados.map(item => item.preco);

    const menor =
        Math.min(...valores);

    const maior =
        Math.max(...valores);

    const largura = 900;
    const altura = 340;

    const margemEsquerda = 82;
    const margemDireita = 24;
    const margemTopo = 30;
    const margemInferior = 55;

    const areaLargura =
        largura -
        margemEsquerda -
        margemDireita;

    const areaAltura =
        altura -
        margemTopo -
        margemInferior;

    const diferenca =
        maior - menor;

    const intervalo =
        diferenca === 0
            ? Math.max(menor * 0.1, 10)
            : diferenca;

    const escalaMin =
        diferenca === 0
            ? Math.max(0, menor - intervalo)
            : menor - intervalo * 0.08;

    const escalaMax =
        diferenca === 0
            ? maior + intervalo
            : maior + intervalo * 0.08;

    const escalaDiferenca =
        escalaMax - escalaMin;

    const pontos =
        dados.map(
            (item, index) => {

                const x =
                    dados.length === 1
                        ? margemEsquerda +
                          areaLargura / 2
                        : margemEsquerda +
                          (
                              index /
                              (dados.length - 1)
                          ) *
                          areaLargura;

                const normalizado =
                    (
                        item.preco -
                        escalaMin
                    ) /
                    escalaDiferenca;

                const y =
                    margemTopo +
                    (
                        1 -
                        normalizado
                    ) *
                    areaAltura;

                return {
                    x,
                    y,
                    preco: item.preco,
                    data: item.data
                };
            }
        );

    const polyline =
        pontos
            .map(
                ponto =>
                    `${ponto.x},${ponto.y}`
            )
            .join(" ");

    const quantidadeLinhas = 5;

    const linhasHorizontais =
        Array.from(
            {
                length:
                    quantidadeLinhas
            },
            (_, index) => {

                const proporcao =
                    index /
                    (
                        quantidadeLinhas - 1
                    );

                const y =
                    margemTopo +
                    proporcao *
                    areaAltura;

                const valor =
                    escalaMax -
                    proporcao *
                    escalaDiferenca;

                return `
                    <line
                        x1="${margemEsquerda}"
                        y1="${y}"
                        x2="${
                            largura -
                            margemDireita
                        }"
                        y2="${y}"
                        stroke="#eeeeee"
                        stroke-width="1"
                    />

                    <text
                        x="${
                            margemEsquerda - 12
                        }"
                        y="${y + 5}"
                        text-anchor="end"
                        font-family="Arial, sans-serif"
                        font-size="12"
                        fill="#6b7280"
                    >
                        ${escaparSVG(
                            formatarMoeda(valor)
                        )}
                    </text>
                `;
            }
        )
        .join("");

    const circulos =
        pontos
            .map(
                (ponto, index) => {

                    const ehMenor =
                        ponto.preco === menor;

                    const ehMaior =
                        ponto.preco === maior;

                    return `
                        <g>
                            <circle
                                cx="${ponto.x}"
                                cy="${ponto.y}"
                                r="${
                                    ehMenor ||
                                    ehMaior
                                        ? 7
                                        : 5
                                }"
                                fill="#16a34a"
                                stroke="#ffffff"
                                stroke-width="3"
                            />

                            ${
                                ehMenor ||
                                ehMaior
                                    ? `
                                        <text
                                            x="${ponto.x}"
                                            y="${
                                                ponto.y -
                                                14
                                            }"
                                            text-anchor="middle"
                                            font-family="Arial, sans-serif"
                                            font-size="11"
                                            font-weight="700"
                                            fill="#374151"
                                        >
                                            ${escaparSVG(
                                                formatarMoeda(
                                                    ponto.preco
                                                )
                                            )}
                                        </text>
                                    `
                                    : ""
                            }
                        </g>
                    `;
                }
            )
            .join("");

    const datas =
        dados.map(
            item =>
                formatarData(
                    item.data
                )
        );

    const primeiraData =
        datas[0];

    const ultimaData =
        datas[datas.length - 1];

    return `
        <div class="history-chart">

            <div class="history-chart-wrapper">

                <svg
                    viewBox="0 0 ${largura} ${altura}"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Gráfico histórico de preços"
                >

                    ${linhasHorizontais}

                    <polyline
                        points="${polyline}"
                        fill="none"
                        stroke="#16a34a"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    ${circulos}

                </svg>

            </div>

            <div class="history-chart-dates">

                <span>
                    ${escaparHTML(
                        primeiraData
                    )}
                </span>

                <span>
                    ${escaparHTML(
                        ultimaData
                    )}
                </span>

            </div>

            <div class="history-chart-summary">

                <span>
                    Menor:
                    <strong>
                        ${formatarMoeda(
                            menor
                        )}
                    </strong>
                </span>

                <span>
                    Maior:
                    <strong>
                        ${formatarMoeda(
                            maior
                        )}
                    </strong>
                </span>

            </div>

            <p class="history-description">
                O gráfico mostra os últimos
                ${dados.length}
                registros de preço disponíveis.
            </p>

        </div>
    `;
}

/* =========================================================
   AUTENTICAÇÃO
========================================================= */

function abrirAuthModal() {
    fecharMenuUsuario();

    const modal =
        document.getElementById(
            "authModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "show"
    );

    mostrarLogin();
}


function fecharAuthModal() {
    const modal =
        document.getElementById(
            "authModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );

    modal.classList.remove(
        "show"
    );
}


function mostrarLogin() {
    const login =
        document.getElementById(
            "loginScreen"
        );

    const register =
        document.getElementById(
            "registerScreen"
        );

    if (login) {
        login.style.display =
            "block";
    }

    if (register) {
        register.style.display =
            "none";
    }

    limparMensagem(
        "loginMessage"
    );

    limparMensagem(
        "registerMessage"
    );
}


function mostrarCadastro() {
    const login =
        document.getElementById(
            "loginScreen"
        );

    const register =
        document.getElementById(
            "registerScreen"
        );

    if (login) {
        login.style.display =
            "none";
    }

    if (register) {
        register.style.display =
            "block";
    }

    limparMensagem(
        "loginMessage"
    );

    limparMensagem(
        "registerMessage"
    );
}


async function fazerLogin(
    event
) {
    event.preventDefault();

    const email =
        document.getElementById(
            "loginEmail"
        )?.value.trim();

    const senha =
        document.getElementById(
            "loginPassword"
        )?.value;

    const mensagem =
        document.getElementById(
            "loginMessage"
        );

    try {
        if (mensagem) {
            mensagem.textContent =
                "Entrando...";

            mensagem.className =
                "auth-message";
        }

        const resposta =
            await fetch(
                `${API_URL}/auth/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email,
                            senha
                        })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "E-mail ou senha incorretos."
            );
        }

        const token =
            dados.token;

        if (!token) {
            throw new Error(
                "O servidor não retornou um token."
            );
        }

        localStorage.setItem(
            TOKEN_KEY,
            token
        );

        usuarioAtual =
            dados.usuario ||
            dados;

        atualizarInterfaceUsuario();

        await carregarFavoritos();

        fecharAuthModal();

        mostrarToast(
            `Bem-vindo, ${
                usuarioAtual.nome ||
                "usuário"
            }!`
        );

        document
            .getElementById(
                "loginForm"
            )
            ?.reset();

        await processarAlertaPendente();

    } catch (erro) {
        console.error(erro);

        if (mensagem) {
            mensagem.textContent =
                erro.message;

            mensagem.className =
                "auth-message error";
        }
    }
}


async function fazerCadastro(
    event
) {
    event.preventDefault();

    const nome =
        document.getElementById(
            "registerName"
        )?.value.trim();

    const email =
        document.getElementById(
            "registerEmail"
        )?.value.trim();

    const senha =
        document.getElementById(
            "registerPassword"
        )?.value;

    const confirmar =
        document.getElementById(
            "registerPasswordConfirm"
        )?.value;

    const mensagem =
        document.getElementById(
            "registerMessage"
        );

    if (senha !== confirmar) {
        if (mensagem) {
            mensagem.textContent =
                "As senhas não são iguais.";

            mensagem.className =
                "auth-message error";
        }

        return;
    }

    try {
        if (mensagem) {
            mensagem.textContent =
                "Criando sua conta...";

            mensagem.className =
                "auth-message";
        }

        const resposta =
            await fetch(
                `${API_URL}/auth/cadastro`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            nome,
                            email,
                            senha
                        })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível criar a conta."
            );
        }

        const token =
            dados.token;

        if (token) {
            localStorage.setItem(
                TOKEN_KEY,
                token
            );

            usuarioAtual =
                dados.usuario ||
                dados;

            atualizarInterfaceUsuario();

            await carregarFavoritos();

            fecharAuthModal();

            mostrarToast(
                "Conta criada com sucesso!"
            );

            await processarAlertaPendente();

        } else {
            mostrarLogin();

            mostrarToast(
                "Conta criada! Agora entre na sua conta."
            );
        }

        document
            .getElementById(
                "registerForm"
            )
            ?.reset();

    } catch (erro) {
        console.error(erro);

        if (mensagem) {
            mensagem.textContent =
                erro.message;

            mensagem.className =
                "auth-message error";
        }
    }
}


async function processarAlertaPendente() {
    if (
        !alertaPendente ||
        !usuarioAtual
    ) {
        return;
    }

    const alerta =
        alertaPendente;

    alertaPendente =
        null;

    await criarAlertaPreco(
        alerta.produtoId,
        alerta.precoAlvo,
        null
    );
}


async function fazerLogout() {
    fecharMenuUsuario();

    const token =
        localStorage.getItem(
            TOKEN_KEY
        );

    try {
        if (token) {
            await fetch(
                `${API_URL}/auth/logout`,
                {
                    method:
                        "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );
        }

    } catch (erro) {
        console.error(
            "Erro ao sair:",
            erro
        );

    } finally {
        localStorage.removeItem(
            TOKEN_KEY
        );

        usuarioAtual =
            null;

        favoritos =
            new Set();

        favoritosPesquisaAtual =
            "";

        favoritosOrdenacaoAtual =
            "recentes";

        alertaPendente =
            null;

        atualizarInterfaceUsuario();

        mostrarPaginaInicial();

        renderizarProdutos();

        atualizarResumoFavoritos();

        mostrarToast(
            "Você saiu da sua conta."
        );
    }
}

/* =========================================================
   BUSCA
========================================================= */

function sincronizarBuscaPrincipal() {
    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const heroInput =
        document.getElementById(
            "heroSearchInput"
        );

    if (searchInput) {
        searchInput.value =
            pesquisaAtual;
    }

    if (heroInput) {
        heroInput.value =
            pesquisaAtual;
    }
}


function sincronizarBuscaHero() {
    const heroInput =
        document.getElementById(
            "heroSearchInput"
        );

    if (heroInput) {
        heroInput.value =
            pesquisaAtual;
    }
}


function limparPesquisa() {
    pesquisaAtual =
        "";

    categoriaAtual =
        "Todos";

    sincronizarBuscaPrincipal();

    renderizarCategorias();

    aplicarFiltros();
}

/* =========================================================
   UTILITÁRIOS
========================================================= */

function encontrarMenorPrecoAtual(
    produto
) {
    const precos =
        Array.isArray(
            produto.precos
        )
            ? produto.precos
            : [];

    const valores =
        precos
            .map(
                item =>
                    Number(
                        item.preco
                    )
            )
            .filter(
                Number.isFinite
            );

    if (!valores.length) {
        const valor =
            Number(
                produto.menor_preco
            );

        return Number.isFinite(
            valor
        )
            ? valor
            : null;
    }

    return Math.min(
        ...valores
    );
}


function encontrarLojaMenorPreco(
    produto
) {
    const precos =
        Array.isArray(
            produto.precos
        )
            ? produto.precos
            : [];

    if (!precos.length) {
        return null;
    }

    const ordenados =
        [...precos].sort(
            (a, b) =>
                Number(a.preco) -
                Number(b.preco)
        );

    return (
        ordenados[0]?.loja ||
        null
    );
}


function formatarMoeda(
    valor
) {
    if (
        valor === null ||
        valor === undefined ||
        !Number.isFinite(
            Number(valor)
        )
    ) {
        return "—";
    }

    return Number(
        valor
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function formatarData(
    data
) {
    if (!data) {
        return "Data não informada";
    }

    const texto =
        String(data);

    const dataObjeto =
        new Date(
            texto.includes("T")
                ? texto
                : texto.replace(
                    " ",
                    "T"
                ) + "Z"
        );

    if (
        Number.isNaN(
            dataObjeto.getTime()
        )
    ) {
        return texto;
    }

    return dataObjeto.toLocaleDateString(
        "pt-BR"
    );
}

/* =========================================================
   FALLBACK DE IMAGEM
========================================================= */

function gerarImagemFallback(
    nome
) {
    const titulo =
        String(
            nome ||
            "Produto"
        ).slice(
            0,
            35
        );

    const iniciais =
        titulo
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                palavra =>
                    palavra[0]
            )
            .join("")
            .toUpperCase();

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="500"
            viewBox="0 0 600 500"
        >

            <rect
                width="600"
                height="500"
                rx="28"
                fill="#f3f4f6"
            />

            <rect
                x="170"
                y="90"
                width="260"
                height="230"
                rx="24"
                fill="#ffffff"
                stroke="#e5e7eb"
                stroke-width="4"
            />

            <circle
                cx="300"
                cy="190"
                r="62"
                fill="#16a34a"
            />

            <text
                x="300"
                y="210"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="52"
                font-weight="700"
                fill="#ffffff"
            >
                ${escaparSVG(iniciais)}
            </text>

            <text
                x="300"
                y="370"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="22"
                font-weight="600"
                fill="#374151"
            >
                Imagem do produto
            </text>

            <text
                x="300"
                y="405"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="16"
                fill="#6b7280"
            >
                PreçoJusto
            </text>

        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8;" +
        encodeURIComponent(svg)
    );
}


function escaparSVG(
    valor
) {
    return String(
        valor || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&apos;"
        );
}


function escaparHTML(
    valor
) {
    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function limparMensagem(
    id
) {
    const elemento =
        document.getElementById(
            id
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        "";

    elemento.className =
        "auth-message";
}


function mostrarToast(
    mensagem
) {
    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }

    clearTimeout(
        toastTimeout
    );

    toast.textContent =
        mensagem;

    toast.classList.remove(
        "hidden"
    );

    toast.classList.add(
        "show"
    );

    toastTimeout =
        setTimeout(
            function () {
                toast.classList.add(
                    "hidden"
                );

                toast.classList.remove(
                    "show"
                );
            },
            3000
        );
}

/* =========================================================
   NAVEGAÇÃO DO NAVEGADOR
========================================================= */

window.addEventListener(
    "popstate",
    function () {
        const params =
            new URLSearchParams(
                window.location.search
            );

        if (
            params.get("favoritos") ===
            "true"
        ) {
            abrirFavoritos(false);

            return;
        }

        if (
            params.get("alertas") ===
            "true"
        ) {
            abrirPaginaAlertas(false);

            return;
        }

        verificarPaginaProduto();
    }
);

/* =========================================================
   EXPORTAÇÕES
========================================================= */

window.abrirProduto =
    abrirProduto;

window.voltarParaProdutos =
    voltarParaProdutos;

window.abrirAuthModal =
    abrirAuthModal;

window.fecharAuthModal =
    fecharAuthModal;

window.fazerLogout =
    fazerLogout;

window.mostrarToast =
    mostrarToast;

window.limparPesquisa =
    limparPesquisa;

window.alternarFavorito =
    alternarFavorito;

window.abrirPaginaAlertas =
    abrirPaginaAlertas;

window.criarAlertaPreco =
    criarAlertaPreco;

window.excluirAlerta =
    excluirAlerta;



   // ================================
// BOTÕES DOS FILTROS AVANÇADOS
// ================================

const applyFiltersButton = document.getElementById("applyFiltersButton");

const clearFiltersButton = document.getElementById("clearFiltersButton");

if (applyFiltersButton) {

    applyFiltersButton.addEventListener("click", () => {

        aplicarFiltros();

    });

}

if (clearFiltersButton) {

    clearFiltersButton.addEventListener("click", () => {

        categoriaAtual = "Todos";
        pesquisaAtual = "";

        const minPriceInput =
            document.getElementById("minPriceInput");

        const maxPriceInput =
            document.getElementById("maxPriceInput");

        const storeFilterSelect =
            document.getElementById("storeFilterSelect");

        if (minPriceInput) {
            minPriceInput.value = "";
        }

        if (maxPriceInput) {
            maxPriceInput.value = "";
        }

        if (storeFilterSelect) {
            storeFilterSelect.value = "todas";
        }

        aplicarFiltros();

    });

}