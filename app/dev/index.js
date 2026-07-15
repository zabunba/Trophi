// pronto, isto é basicamente o "core" todo da app metido num ficheiro só
// (ainda tenho de separar isto em módulos como deus manda, um dia destes)

import { DeviceEventEmitter } from "react-native";
import { Dimensions, PixelRatio } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import TextRecognition from "@react-native-ml-kit/text-recognition"; // isto é magia a sério
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";


// tamanho de letra que se adapta ao ecrã, pq nem todos os telemoveis sao iguais grr

const { width, height } = Dimensions.get("window");
const shortDim = Math.min(width, height);
const base = Math.min(shortDim, 430);

const MIN_BASE = 360;
const MAX_BASE = 520; // acima disto já é tablet e ninguem me testou em tablet lol

export const fontSize = (size) => {
    const t = (base - MIN_BASE) / (MAX_BASE - MIN_BASE); // 0 no ecrã pequeno, 1 no grande
    const scale = 1 + t * 0.25; // pequeno = 1x, grande = 1.25x
    return PixelRatio.roundToNearestPixel((size / 100) * base * scale);
};

// carrega as fontes, se nao carregar bem tambem nao vou chorar

function loadCustomFont() {
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_700Bold,
    });

    if (!fontsLoaded) return null;
}


export { loadCustomFont };

const { height: screenHeight } = Dimensions.get("screen"); // "screen" inclui a barra de navegação
const { height: windowHeight } = Dimensions.get("window"); // isto já não inclui
const navBarHeight = Math.min(screenHeight - windowHeight, 48) > 0 ? Math.min(screenHeight - windowHeight, 48) : 48; // altura real da nav bar, cap a 48 pq alguns telemoveis dao valores estranhos

export { navBarHeight };


// limite de escala pra nao ficar gigante em tablets
const scale = Math.min(shortDim / 375, 1.3);

export const normalize = (size) => {
    return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

// so pra tirar a primeira letra, simples e directo

export function fLetter(str) {
    return str?.[0] ?? "";
}

// calcula "faltam quantos dias" a partir de uma data, tipo o pandas.to_datetime mas a pé

export function howManyTime(dateStr) {
    if (!dateStr) return "—";

    let year, month, day;

    // formato SQLite
    if (dateStr.includes("-")) {
        [year, month, day] = dateStr.split("-").map(Number);
    }
    // formato Europeu/camara
    else if (dateStr.includes("/")) {
        [day, month, year] = dateStr.split("/").map(Number);
    }
    // fallback pra dados corrompidos, acontece mais do que gostava
    else {
        return "Invalid Date";
    }

    // cria a data alvo exatamente à meia noite
    const target = new Date(year, month - 1, day);

    // hoje tambem à meia noite, pra comparação ficar limpa
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // a lógica em si
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;

    return `${Math.floor(diffDays / 365)} years`;
}

// gera datas aleatorias, usado só pra teste / mock data

export function randomDate(dayMax, monthMax, yearMax) {
    const today = new Date();
    const day = Math.floor(Math.random() * (dayMax - today.getDate() + 1)) + today.getDate();
    const month = Math.floor(Math.random() * (monthMax - today.getMonth() + 1)) + today.getMonth() + 1;
    const year = Math.floor(Math.random() * (yearMax - today.getFullYear() + 1)) + today.getFullYear();
    return `${day}/${month}/${year}`;
}

// gerador de dados falsos pra testar a UI sem ter de meter produtos a mao tipo otario

function numberGen(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomOldDate(dayMax, monthMax, yearMax) {
    const today = new Date();
    const day = Math.floor(Math.random() * today.getDate()) + 1;
    const month = Math.floor(Math.random() * today.getMonth()) + 1;
    const year = Math.floor(Math.random() * (today.getFullYear() - yearMax + 1)) + yearMax;
    return `${day}/${month}/${year}`;
}

function letterGen(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateNutriScore() {
    var characters = "ABCDEF";
    return characters.charAt(Math.floor(Math.random() * characters.length));
}


// Isto tem de ficar sincronizado com APP_CATEGORIES no pipeline em Python (tst.py) —
// estas strings sao comparadas ao milimetro com a coluna "category" da BD, cuidado
const catg = [
    "Proteins",
    "Dairy",
    "Vegetables",
    "Fruits",
    "Carbs",
    "Legumes",
    "Canned",
    "Frozen",
    "Condiments",
    "Snacks",
    "Drinks",
    "Prepared Meals",
    "Breakfast & Sweets",
    "Other"
]

function dataGenerator(min, max) {

    const amount = numberGen(min, max);

    let dataNoise = [];

    for (let i = 0; i < amount; i++) {
        dataNoise[i] = {
            id: `POD-${i}`,
            name: `${letterGen(4)}#${i}`,
            validationDate: randomDate(25, 10, 2026),
            units: numberGen(1, 10),
            type: catg[numberGen(0, (catg.length - 1))],
            nutriScore: generateNutriScore(),
            inputDate: randomOldDate(20, 3, 2026),
        }
    }

    return dataNoise;
}

export { numberGen, dataGenerator };

// a parte mais chata de todas, parsing de datas de OCR é sofrimento

// HELPERS

function pad(n) {
    return String(n).padStart(2, "0");
}

function lastDayOf(year, month) {
    return new Date(Number(year), Number(month), 0).getDate();
}

// Corrige as confusões clássicas de dígito/letra que o OCR faz, mas SÓ dentro
// de sequências que já parecem números. Não faço replace global pra nao
// destruir palavras a sério (aprendi isto da pior forma).

function fixOcrDigits(text) {
    return text
        .replace(/O/g, "0")   // O maiúsculo → 0
        .replace(/o/g, "0")   // o minúsculo → 0 (cuidado: só dentro de contexto numérico)
        .replace(/[lI|]/g, "1")
        .replace(/S/g, "5")
        .replace(/B/g, "8")
        .replace(/Z/g, "2");
}


// Limpa o ruído: fica só com dígitos, letras, espaços e separadores (/ - . :)
// e junta espaços/newlines a mais num só. Basicamente um "trim on steroids".

function cleanText(raw) {
    return raw
        .replace(/[^\w\s\/\-\.\:]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// parseDate  (usado pelo Home.jsx pra ordenar/filtrar)
// Aceita "YYYY-MM-DD" (o nosso formato interno) E o legado "DD/MM/YYYY"
export function parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
    }

    // fallback, se nada bater certo
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
}


// extractAndNormalizeDate
// devolve "YYYY-MM-DD" ou null se nao conseguir arranjar nada de jeito

export function extractAndNormalizeDate(rawText) {
    if (!rawText || typeof rawText !== "string") return null;

    // corre tanto no texto limpo normal como na versão com os dígitos corrigidos.
    // o que der resultado primeiro, ganha
    const versions = [
        cleanText(rawText),
        fixOcrDigits(cleanText(rawText)),
    ];

    for (const text of versions) {
        const result = _tryAllFormats(text);
        if (result) return result;
    }

    return null;
}

// nomes dos meses (EN / PT / ES)
const MONTH_NAMES = {
    // inglês
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
    january: "01", february: "02", march: "03", april: "04",
    june: "06", july: "07", august: "08", september: "09",
    october: "10", november: "11", december: "12",
    // português
    fev: "02", abr: "04", mai: "05", ago: "08",
    set: "09", out: "10", dez: "12",
    janeiro: "01", fevereiro: "02", marco: "03", abril: "04",
    maio: "05", junho: "06", julho: "07", agosto: "08",
    setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
    // espanhol
    ene: "01", dic: "12",
    enero: "01", febrero: "02", marzo: "03",
    junio: "06", julio: "07", agosto2: "08",
    octubre: "10", noviembre: "11", diciembre: "12",
};

const MON_PATTERN = Object.keys(MONTH_NAMES).join("|");

function _tryAllFormats(raw) {
    const t = raw.toLowerCase();

    // tirar prefixos tipo "EXP:", "BB:", "PROD:", "USE BY:" pra nao
    // confundirem os padrões de dígitos que vêm a seguir.
    // procuramos a data DEPOIS destas palavras primeiro (é a aposta mais segura)
    const labelPrefixes = [
        /\b(?:exp(?:iry)?|best\s*before|bb|use\s*by|validade|val|vence|consume\s*before|cons\.?\s*before)\s*[:\-]?\s*/i,
    ];

    for (const prefix of labelPrefixes) {
        const match = raw.match(prefix);
        if (match) {
            // tenta ler o que vem logo a seguir ao label
            const afterLabel = raw.slice(match.index + match[0].length, match.index + match[0].length + 30);
            const r = _tryDatePatterns(afterLabel.toLowerCase());
            if (r) return r;
        }
    }

    //  tenta a linha toda
    return _tryDatePatterns(t);
}

function _tryDatePatterns(t) {

    // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
    const iso = t.match(/\b(20\d{2})[\/\-\.](0[1-9]|1[0-2])[\/\-\.](0[1-9]|[12]\d|3[01])\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY formato europeu
    const euro = t.match(/\b(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](20\d{2})\b/);
    if (euro) return `${euro[3]}-${euro[2]}-${pad(euro[1])}`;

    // DD MM YYYY — com espaços como separador (ex: "29 08 2027")
    // comum em carimbos de validade tipo "PROD : 17 05 2026"
    const spaced = t.match(/\b(0[1-9]|[12]\d|3[01])\s+(0[1-9]|1[0-2])\s+(20\d{2})\b/);
    if (spaced) return `${spaced[3]}-${spaced[2]}-${pad(spaced[1])}`;

    // YYYY MM DD — formato ISO mas com espaços
    const isoSpaced = t.match(/\b(20\d{2})\s+(0[1-9]|1[0-2])\s+(0[1-9]|[12]\d|3[01])\b/);
    if (isoSpaced) return `${isoSpaced[1]}-${isoSpaced[2]}-${isoSpaced[3]}`;

    // DD NomeMes YYYY, tipo "15 JAN 2027" ou "15-Jan-2027"
    const dayMonYear = t.match(
        new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])[\\s\\/\\-\\.](${MON_PATTERN})[\\s\\/\\-\\.](20\\d{2})\\b`, "i")
    );
    if (dayMonYear) {
        const m = MONTH_NAMES[dayMonYear[2].toLowerCase()];
        if (m) return `${dayMonYear[3]}-${m}-${pad(dayMonYear[1])}`;
    }

    // sem dia
    const monYear = t.match(
        new RegExp(`\\b(${MON_PATTERN})[\\s\\/\\-\\.](20\\d{2})\\b`, "i")
    );
    if (monYear) {
        const m = MONTH_NAMES[monYear[1].toLowerCase()];
        if (m) {
            const ld = lastDayOf(monYear[2], m);
            return `${monYear[2]}-${m}-${pad(ld)}`;
        }
    }

    // YYYY NomeMes, tipo "2027 JAN"
    const yearMon = t.match(
        new RegExp(`\\b(20\\d{2})[\\s\\/\\-\\.](${MON_PATTERN})\\b`, "i")
    );
    if (yearMon) {
        const m = MONTH_NAMES[yearMon[2].toLowerCase()];
        if (m) {
            const ld = lastDayOf(yearMon[1], m);
            return `${yearMon[1]}-${m}-${pad(ld)}`;
        }
    }

    // MM/YYYY ou MM-YYYY ou MM.YYYY, tipo "03/2027"
    // assume último dia do mês (produto válido até ao fim desse mês)
    const mmYyyy = t.match(/\b(0[1-9]|1[0-2])[\/\-\.](20\d{2})\b/);
    if (mmYyyy) {
        const ld = lastDayOf(mmYyyy[2], mmYyyy[1]);
        return `${mmYyyy[2]}-${mmYyyy[1]}-${pad(ld)}`;
    }

    // YYYYMM colado, tipo "202703" (o OCR comeu o separador, tipico)
    const runTogether = t.match(/\b(20\d{2})(0[1-9]|1[0-2])\b/);
    if (runTogether) {
        const ld = lastDayOf(runTogether[1], runTogether[2]);
        return `${runTogether[1]}-${runTogether[2]}-${pad(ld)}`;
    }

    // só o ano — último recurso mesmo, quando não há mais nada
    const yearOnly = t.match(/\b(20[2-9]\d)\b/);
    if (yearOnly) return `${yearOnly[1]}-12-31`;

    return null;
}


// extractQuantityFromText
// devolve um inteiro >= 1 ou null

export function extractQuantityFromText(rawText) {
    if (!rawText || typeof rawText !== "string") return null;

    const text = cleanText(rawText);

    // MULTIPACK com unidade: "4x125g", "8×70G", "6 x 1L"
    const multipack = text.match(
        /\b(\d{1,2})\s*[xX×]\s*\d+[\.,]?\d*\s*(g|ml|kg|l|cl|oz|lb)\b/i
    );
    if (multipack) {
        const qty = parseInt(multipack[1], 10);
        if (qty >= 2 && qty <= 99) return qty;
    }

    // "N x N" simples
    const plainMulti = text.match(/\b(\d{1,2})\s*[xX×]\s*\d+\b/);
    if (plainMulti) {
        const qty = parseInt(plainMulti[1], 10);
        if (qty >= 2 && qty <= 24) return qty;
    }

    // "pack/box/set of N"
    const packOf = text.match(
        /(?:pack|box|set|lot|caixa|boite|doos)\s+(?:of|de|von|van|di)\s+(\d{1,2})\b/i
    );
    if (packOf) {
        const qty = parseInt(packOf[1], 10);
        if (qty >= 2 && qty <= 99) return qty;
    }

    // D. "N units / N unidades / N pcs / N Stück …"
    const unitWord = text.match(
        /\b(\d{1,2})\s*(?:unit[ae]?s?|unidades?|pcs?|pieces?|pi[eè]ces?|st[üu]ck|stuks|pezzi)\b/i
    );
    if (unitWord) {
        const qty = parseInt(unitWord[1], 10);
        if (qty >= 2 && qty <= 99) return qty;
    }

    // tem peso/volume mas nao ha sinal de multipack
    // "250g", "1.5kg", "500ml", "330cl", "12oz", "1lb"
    const singleUnit = text.match(/\b\d+[\.,]?\d*\s*(g|ml|kg|l|cl|oz|lb)\b/i);
    if (singleUnit) return 1;

    return null;
}

// tudo o que mexe na BD local, sqlite is my beloved (roubado do python, mas é verdade aqui tambem)

const DB_NAME = "pbase.db";

let _db = null;

async function initDB() {
    if (_db) return _db;

    _db = await SQLite.openDatabaseAsync(DB_NAME);

    //cria a tabela com o schema MÍNIMO original
    //(isto é seguro mesmo que já exista)
    await _db.execAsync(`
        CREATE TABLE IF NOT EXISTS userProducts (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );
    `);

    //verifico o PRAGMA primeiro pq o SQLite em versões antigas NÃO
    //ignora silenciosamente um "ADD COLUMN" numa coluna que já existe
    const existingColumns = await _db.getAllAsync(`PRAGMA table_info(userProducts)`);
    const columnNames = existingColumns.map(c => c.name);

    const migrations = [
        { name: "barcode", sql: "ALTER TABLE userProducts ADD COLUMN barcode        TEXT" },
        { name: "nutriscore", sql: "ALTER TABLE userProducts ADD COLUMN nutriscore     TEXT" },
        { name: "category", sql: "ALTER TABLE userProducts ADD COLUMN category       TEXT" },
        { name: "type", sql: "ALTER TABLE userProducts ADD COLUMN type           TEXT" },
        { name: "validationDate", sql: "ALTER TABLE userProducts ADD COLUMN validationDate TEXT" },
        { name: "inputDate", sql: "ALTER TABLE userProducts ADD COLUMN inputDate      TEXT" },
        { name: "units", sql: "ALTER TABLE userProducts ADD COLUMN units          INTEGER DEFAULT 1" },
    ];

    for (const migration of migrations) {
        if (!columnNames.includes(migration.name)) {
            await _db.execAsync(migration.sql);
            console.log(`Added column: ${migration.name}`);
        }
    }

    return _db;
}

// wrapper de retry pra cold starts (sem Metro / USB desligado, a treta do costume)
async function withRetry(fn, retries = 3, delayMs = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`attempt ${i + 1} failed: ${err.message}`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}

export async function getProducts() {
    try {
        return await withRetry(async () => {
            const db = await initDB();
            const rows = await db.getAllAsync("SELECT * FROM userProducts");
            return rows.map((row) => ({
                id: `POD-${row.id}`,
                name: row.name,
                validationDate: row.validationDate ?? "",
                units: row.units ?? 1,
                type: row.type ?? "Unknown",
                nutriScore: row.nutriscore ?? "unknown",
                inputDate: row.inputDate ?? "",
                barcode: row.barcode ?? "",
                category: row.category ?? "Other",
            }));
        });
    } catch (error) {
        console.error("[getProducts] failed:", error.message, error.stack);
        return [];
    }
}

// insere vários produtos de uma vez, tipo quando fazes scan em lote de QR codes
export const insertBatchProducts = async (productsArray) => {
    // chama o initDB pra garantir que a BD ta pronta e usamos a instância certa
    const db = await initDB();

    try {
        await db.withTransactionAsync(async () => {
            const now = new Date().toISOString(); // guarda o momento exato do scan em lote

            for (const p of productsArray) {
                await db.runAsync(
                    `INSERT INTO userProducts (name, barcode, nutriscore, category, type, validationDate, inputDate, units) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        p.name,
                        p.barcode,
                        p.nutriScore,
                        p.category,
                        p.type,
                        p.validationDate,
                        now,
                        p.quantity
                    ]
                );
            }
        });
        console.log(`Successfully batch inserted ${productsArray.length} products into userProducts.`);
    } catch (error) {
        console.error("Batch insert failed:", error);
        throw error;
    }
};

export async function insertProduct(name, barcode, nutriscore, category, type, validationDate, units) {
    try {
        const db = await initDB();
        const currentDate = new Date().toISOString();

        console.log("=== DB LOG: INSERT PRODUCT ===");
        console.log(`Name: ${name}, Barcode: ${barcode}, Units: ${units}`);
        console.log(`Nutriscore: ${nutriscore}, Category: ${category}, Type: ${type}`);
        console.log(`Expiry: ${validationDate}, Insert Date: ${currentDate}`);
        console.log("===============================");

        await db.runAsync(
            `INSERT INTO userProducts
                (name, barcode, nutriscore, category, type, validationDate, inputDate, units)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, barcode, nutriscore, category, type, validationDate, currentDate, units]
        );

        DeviceEventEmitter.emit("db_changed");
        console.log("Product successfully inserted into DB!");

    } catch (error) {
        console.error("[insertProduct] failed:", error.message, error.stack);
    }
}

export async function consumeProduct(id, currentUnits) {
    try {
        const db = await initDB();
        const numericId = id.replace("POD-", "");

        if (currentUnits > 1) {
            await db.runAsync("UPDATE userProducts SET units = units - 1 WHERE id = ?", [numericId]);
            DeviceEventEmitter.emit("db_changed");
            console.log(`Unit consumed. Remaining: ${currentUnits - 1}`);
        } else {
            // já não sobra nenhuma unidade, apaga o produto de vez
            await deleteProduct(id);
        }
    } catch (error) {
        console.error("[consumeProduct] failed:", error.message, error.stack);
    }
}

export async function deleteProduct(id) {
    try {
        const db = await initDB();
        const numericId = id.replace("POD-", "");
        await db.runAsync("DELETE FROM userProducts WHERE id = ?", [numericId]);
        DeviceEventEmitter.emit("db_changed");
    } catch (error) {
        console.error("[deleteProduct] failed:", error.message, error.stack);
    }
}

export async function deleteAllProducts() {
    try {
        const db = await initDB();
        await db.runAsync("DELETE FROM userProducts");
        DeviceEventEmitter.emit("db_changed");
    } catch (error) {
        console.error("[deleteAllProducts] failed:", error.message, error.stack);
    }
}

// gera dados falsos pra testar a app sem ter de andar a inserir produtos a mao tipo palhaço
export async function generateNoiseData(amount = 5) {
    const adjectives = ["Crispy", "Fresh", "Organic", "Premium", "Classic", "Spicy", "Sweet"];
    const nouns = ["Apple", "Bread", "Yogurt", "Cheese", "Pasta", "Juice", "Chicken"];
    const cats = ["Fruits", "Carbs", "Dairy", "Dairy", "Carbs", "Drinks", "Proteins"];
    const types = ["Yogurt", "Cheese", "Butter", "Cream", "Milk",
        "Ketchup", "Mayonnaise", "Mustard", "Sauce",
        "Tomato", "Bread", "Egg", "Sugar", "Apple",
        "Potato", "Pasta", "Rice", "Chicken", "Beef",
        "Pork", "Fish", "Water", "Juice", "Coffee",
        "Tea", "Chocolate", "Biscuit", "Oil", "Beer", "Wine"];
    const nutriscores = ["a", "b", "c", "d", "e"];

    for (let i = 0; i < amount; i++) {
        const rIndex = Math.floor(Math.random() * nouns.length);
        const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[rIndex]}`;
        const category = cats[rIndex];
        const type = types[rIndex];
        const barcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
        const nutriScore = nutriscores[Math.floor(Math.random() * nutriscores.length)];

        const today = new Date();
        today.setDate(today.getDate() + Math.floor(Math.random() * 40) - 10);
        const validationDate = today.toISOString().split("T")[0];
        const randomUnits = Math.floor(Math.random() * 5) + 1;

        await insertProduct(name, barcode, nutriScore, category, type, validationDate, randomUnits);
    }
}

export async function updateProduct(id, { name, category, type, validationDate, units, nutriscore }) {
    try {
        const db = await initDB();
        const numericId = id.replace("POD-", "");
        await db.runAsync(
            `UPDATE userProducts SET name=?, category=?, type=?, validationDate=?, units=?, nutriscore=? WHERE id=?`,
            [name, category, type, validationDate, units, nutriscore, numericId]
        );
        DeviceEventEmitter.emit("db_changed");
    } catch (error) {
        console.error("[updateProduct] failed:", error.message, error.stack);
    }
}


// mudei o nome do destino de propósito pra forçar update
// faz a app ignorar bases de dados vazias corrompidas e extrair a nova
const OFF_DB_NAME = "trophi.db";

let dbConnection = null;

export async function getProductByBarcode(barcode) {
    try {
        if (!dbConnection) {
            const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
            const dbPath = `${dbDirectory}/${OFF_DB_NAME}`;

            // garante que a pasta SQLite existe
            const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });
            }

            const dbInfo = await FileSystem.getInfoAsync(dbPath);

            // 2. verifica o tamanho do ficheiro pra nao abrir uma BD vazia por engano
            if (!dbInfo.exists || dbInfo.size === 0) {
                console.log("Extracting database from APK to device...");

                // carrega o asset que vem dentro da app
                const asset = Asset.fromModule(require("../assets/trophi.db"));
                await asset.downloadAsync();

                // 3. fallback: em APKs nativos o localUri às vezes vem null, entao usa uri
                const assetUri = asset.localUri || asset.uri;

                // copia pra pasta que o SQLite consegue ler
                await FileSystem.copyAsync({
                    from: assetUri,
                    to: dbPath,
                });

                console.log("Database copied successfully!");
            }

            // abre a ligação à BD já extraída
            dbConnection = await SQLite.openDatabaseAsync(OFF_DB_NAME);
        }

        const result = await dbConnection.getFirstAsync("SELECT * FROM products WHERE barcode = ?", [barcode]);

        return result;
    } catch (error) {
        console.error("Error searching product:", error);
        return null;
    }
}

export async function getRecipes() {
    try {
        if (!dbConnection) await getProductByBarcode("__init__"); // truque feio pra garantir que a ligação existe, eu sei, eu sei
        const results = await dbConnection.getAllAsync("SELECT * FROM recipes");
        return results.map(r => ({
            ...r,
            ingredientsValues: JSON.parse(r.ingredients ?? "[]"), // quantidades tipo "1 oz Cheese (90g)"
            ingredients: (r.ingredient_types ?? "").split(",").filter(Boolean), // nomes simples tipo "Cheese"
            tutorial: JSON.parse(r.tutorial ?? "[]"),
            ingredient_types: (r.ingredient_types ?? "").split(",").filter(Boolean),
        }));
    } catch (error) {
        console.error("Error fetching recipes:", error);
        return [];
    }
}

export async function getRecipesByTypes(types = []) {
    try {
        if (!dbConnection) await getProductByBarcode("__init__");
        if (types.length === 0) return getRecipes();

        const placeholders = types.map(() => "?").join(",");
        // cada receita tem ingredient_types como "Milk,Cheese,Tomato"
        // vamos buscar receitas que contenham pelo menos um dos tipos
        const all = await dbConnection.getAllAsync("SELECT * FROM recipes");
        const filtered = all.filter(r => {
            const rTypes = r.ingredient_types?.split(",") ?? [];
            return types.some(t => rTypes.includes(t));
        });

        return filtered.map(r => ({
            ...r,
            ingredients: JSON.parse(r.ingredients ?? "[]"),
            tutorial: JSON.parse(r.tutorial ?? "[]"),
            ingredient_types: r.ingredient_types?.split(",").filter(Boolean) ?? [],
        }));
    } catch (error) {
        console.error("Error filtering recipes:", error);
        return [];
    }
}


export async function extractTextLocally(imageUri) {
    try {
        // a magia acontece aqui: processamento 100% offline no próprio telemovel
        const result = await TextRecognition.recognize(imageUri);

        if (result && result.text) {
            return result.text;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Local OCR error (ML Kit):", error);
        return null;
    }
}



export const processBatchQRCode = async (qrString) => {
    if (!qrString) return { success: 0, failed: 0 };

    // as entradas podem vir separadas por newline OU espaço dependendo de como
    // o código em lote foi gerado/colado — separa por qualquer whitespace, nao só "\n"
    const lines = qrString.split(/\s+/).map(l => l.trim()).filter(l => l.length > 0);
    const productsToInsert = [];
    let failCount = 0;

    for (const line of lines) {
        try {
            const parts = line.split("-");
            if (parts.length !== 3) {
                console.warn(`Invalid format: ${line}`);
                failCount++;
                continue;
            }

            const [barcode, qtyStr, rawDate] = parts;
            const quantity = parseInt(qtyStr, 10) || 1;

            let formattedDate = rawDate;
            if (rawDate.length === 8) {
                formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
            }

            // busca a info do produto sequencialmente pra nao levar rate-limit da API
            const product = await getProductByBarcode(barcode);

            productsToInsert.push({
                name: product?.name || "Unknown Product",
                barcode: barcode,
                nutriScore: product?.nutriscore || "unknown",
                category: product?.category || "Other",
                type: product?.type || "Unknown",
                validationDate: formattedDate,
                quantity: quantity
            });

        } catch (error) {
            console.error(`Error parsing line: ${line}`, error);
            failCount++;
        }
    }

    // insere tudo numa única chamada à ponte nativa, mais rápido do que ir um a um
    if (productsToInsert.length > 0) {
        await insertBatchProducts(productsToInsert);
    }

    return { success: productsToInsert.length, failed: failCount };
};


const TASK_EXPIRY = "TASK_EXPIRY_CHECK";
const DAYS_AHEAD = 14;   // agenda com esta antecedência
const MILESTONE_DAYS = [14, 7, 5, 3, 1, 0]; // dispara um alerta dedicado nestes marcos

// setupNotifications
// pede permissão e instala o handler de notificações em primeiro plano
export async function setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    return true;
}

export async function scheduleDailyNotification() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();

    const settings = await loadSettings();
    const slots = resolveNotificationSlots(settings);
    const allProducts = await getProducts();
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    console.log(`${allProducts.length} products in DB.`);

    // pra cada produto x marco, calcula o dia do calendário em que o aviso dispara.
    // agrupa por dia de disparo pra só mandar UMA notificação por dia
    const fireMap = new Map(); // fireDay em ms → { fireDay, items: [{ product, daysLeft }] }

    for (const item of allProducts) {
        if (!item.validationDate) continue;
        const expiry = parseDate(item.validationDate);
        expiry.setHours(0, 0, 0, 0);

        for (const milestoneDays of MILESTONE_DAYS) {
            const fireDay = new Date(expiry);
            fireDay.setDate(fireDay.getDate() - milestoneDays);
            fireDay.setHours(0, 0, 0, 0);

            if (fireDay < today) continue; // já passou, nem vale a pena

            const key = fireDay.getTime();
            if (!fireMap.has(key)) fireMap.set(key, { fireDay, items: [] });
            fireMap.get(key).items.push({ product: item, daysLeft: milestoneDays });
        }
    }

    console.log(`${fireMap.size} milestone day(s) to schedule.`);

    let scheduled = 0;

    for (const { fireDay, items } of fireMap.values()) {
        // escolhe o primeiro slot que ainda esta no futuro nesse dia
        let fireAt = null;
        for (const { hour, minute } of slots) {
            const candidate = new Date(fireDay);
            candidate.setHours(hour, minute, 0, 0);
            if (candidate > now) { fireAt = candidate; break; }
        }
        if (!fireAt) continue;

        // mostra o marco mais urgente desse dia (o que tem menos dias restantes)
        items.sort((a, b) => a.daysLeft - b.daysLeft);
        const urgentDays = items[0].daysLeft;
        const urgentProducts = items.filter(i => i.daysLeft === urgentDays).map(i => i.product);

        const label = urgentDays === 0 ? "today" : urgentDays === 1 ? "tomorrow" : `in ${urgentDays} days`;

        let title, body;
        if (urgentProducts.length === 1) {
            title = `${urgentProducts[0].name} expires ${label}!`;
            body = null;
        } else {
            title = `Multiple products are gonna expire ${label}!`;
            body = null;
        }

        await Notifications.scheduleNotificationAsync({
            identifier: `milestone-${fireDay.getTime()}`,
            content: { title, ...(body ? { body } : {}), sound: true },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: fireAt,
            },
        });

        scheduled++;
        console.log(`"${title}" → ${fireAt.toISOString()}`);
    }

    console.log(`Total scheduled: ${scheduled} notifications.`);
}

export async function checkAndNotify() {
    await scheduleDailyNotification();
}

// resolveNotificationSlots
// devolve um array de { hour, minute } vindo das definições smart ou custom
function resolveNotificationSlots(settings) {
    const parseSlotTime = (timeStr) => {
        try {
            const parts = timeStr.trim().split(" ");
            const timeParts = parts[0].split(":");
            let hour = parseInt(timeParts[0], 10);
            let minute = parseInt(timeParts[1], 10) || 0;
            const period = (parts[1] || "").toUpperCase();
            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
            return { hour, minute };
        } catch (e) {
            return { hour: 9, minute: 0 }; // se der asneira, cai pras 9h e ponto final
        }
    };

    if (settings.smartNotifications) {
        const smart = getSmartIntervals(settings.usageHistogram);
        if (smart && smart.length > 0) {
            console.log(" Using smart slots.");
            return smart.map(s => parseSlotTime(s.start));
        }
        console.log("Not enough smart data, falling back to custom.");
    }

    const custom = settings.customIntervals;
    if (custom && custom.length > 0) {
        console.log("Using custom slots.");
        return custom.map(s => parseSlotTime(s.start));
    }

    // fallback bruto — só as 9h da manhã
    console.log("No slots defined, using 09:00 fallback.");
    return [{ hour: 9, minute: 0 }];
}

// getExpiringForDay
// devolve os produtos cuja validade cai dentro de [dayDate, dayDate + windowDays]
function getExpiringForDay(allProducts, dayDate, windowDays = 7) {
    const from = new Date(dayDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + windowDays);

    return allProducts.filter(item => {
        if (!item.validationDate) return false;
        const expiry = parseDate(item.validationDate);
        expiry.setHours(0, 0, 0, 0);
        return expiry >= from && expiry <= to;
    });
}

// background task — reagenda o conjunto todo de notificações a cada 12h.
// mesmo que o SO se esqueça disto, as notificações já agendadas por DATE
// continuam a disparar na boa, sem precisar do processo da app aberto
TaskManager.defineTask(TASK_EXPIRY, async () => {
    try {
        await checkAndNotify();
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (e) {
        console.error("Failed:", e);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export async function registerExpiryCheck() {
    const already = await TaskManager.isTaskRegisteredAsync(TASK_EXPIRY);
    if (already) return;
    await BackgroundFetch.registerTaskAsync(TASK_EXPIRY, { minimumInterval: 60 * 60 * 12 });
}

export async function unregisterExpiryCheck() {
    const already = await TaskManager.isTaskRegisteredAsync(TASK_EXPIRY);
    if (!already) return;
    await BackgroundFetch.unregisterTaskAsync(TASK_EXPIRY);
}

// dispara uma notificação de teste na hora — útil pra testar isto a mao
export async function debugFireNow() {
    const allProducts = await getProducts();
    const expiring = getExpiringForDay(allProducts, new Date(), 14);
    if (expiring.length === 0) { console.log("nothing expiring in 14 days"); return; }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `${expiring.length} product(s) expiring`,
            body: expiring.map(p => p.name).join(", "),
            sound: true,
        },
        trigger: { seconds: 1 },
    });
    console.log("fired!");
}


const STORE_KEY = "trophi_user_settings";

const DEFAULTS = {
    isFirstLaunch: true,
    name: "",
    language: "pt",
    appearance: "dark",
    diet: "none",
    allergies: { dairy: false, gluten: false, nuts: false, shellfish: false, eggs: false, soy: false },
    smartNotifications: true,
    customIntervals: [
        { id: "1", start: "08:00 AM", end: "10:00 AM" },
        { id: "2", start: "12:00 PM", end: "02:00 PM" },
        { id: "3", start: "06:00 PM", end: "10:00 PM" },
    ],
    usageHistogram: {},
};

export async function loadSettings() {
    try {
        const raw = await SecureStore.getItemAsync(STORE_KEY);
        if (!raw) return { ...DEFAULTS };
        const saved = JSON.parse(raw);
        return {
            ...DEFAULTS,
            ...saved,
            allergies: { ...DEFAULTS.allergies, ...(saved.allergies ?? {}) },
            customIntervals: saved.customIntervals ?? DEFAULTS.customIntervals,
            usageHistogram: saved.usageHistogram ?? DEFAULTS.usageHistogram,
        };
    } catch (e) {
        console.error("load failed:", e);
        return { ...DEFAULTS };
    }
}

export async function saveSettings(settings) {
    try { await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(settings)); }
    catch (e) { console.error("save failed:", e); }
}

export async function patchSettings(partial) {
    const current = await loadSettings();
    const next = { ...current, ...partial };
    await saveSettings(next);
    return next;
}

// NOVO: LIMPA TUDO E VOLTA AOS DEFAULTS
export async function clearSettings() {
    try {
        // apaga mesmo a chave encriptada do dispositivo
        await SecureStore.deleteItemAsync(STORE_KEY);

        // reset à variável de throttle em memória pra o tracking de uso começar do zero
        lastRecordedKey = null;

        return { ...DEFAULTS };
    } catch (e) {
        console.error("clear failed:", e);
        return { ...DEFAULTS };
    }
}

// TRACKING DO COMPORTAMENTO DO UTILIZADOR
let lastRecordedKey = null;
export async function recordAppUsage() {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        // throttle: só regista uma vez por hora pra nao andar a martelar o SecureStore
        const uniqueKey = `${now.toDateString()}_${currentHour}`;
        if (lastRecordedKey === uniqueKey) return;
        lastRecordedKey = uniqueKey;

        const current = await loadSettings();
        const histogram = current.usageHistogram || {};
        const hourStr = currentHour.toString();

        histogram[hourStr] = (histogram[hourStr] || 0) + 1;
        await patchSettings({ usageHistogram: histogram });
    } catch (e) {
        console.error("[uSettings] record usage failed:", e);
    }
}

// CALCULA OS INTERVALOS "INTELIGENTES"
export function getSmartIntervals(histogram) {
    if (!histogram || Object.keys(histogram).length === 0) return null;

    // agrupa as horas em partes do dia com lógica, pra nao ir escolher 8h, 9h, 10h todas juntas
    const buckets = [
        { name: "Morning", range: [5, 11] },
        { name: "Afternoon", range: [12, 17] },
        { name: "Evening", range: [18, 23] },
        { name: "Night", range: [0, 4] }
    ];

    const detected = [];
    for (const bucket of buckets) {
        let bestHour = -1;
        let maxCount = 0;
        for (let h = bucket.range[0]; h <= bucket.range[1]; h++) {
            const count = histogram[h.toString()] || 0;
            if (count > maxCount) { maxCount = count; bestHour = h; }
        }
        if (maxCount > 0) detected.push({ hour: bestHour, count: maxCount });
    }

    // ordena por frequência pra dar prioridade às horas mais ativas
    detected.sort((a, b) => b.count - a.count);
    const top3 = detected.slice(0, 3);
    if (top3.length === 0) return null;

    // formata em strings de hora
    return top3.map((item, index) => {
        const h = item.hour;
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const start = `${displayHour.toString().padStart(2, "0")}:00 ${period}`;

        const endHour = (h + 1) % 24;
        const endPeriod = endHour >= 12 ? "PM" : "AM";
        const displayEndHour = endHour % 12 === 0 ? 12 : endHour % 12;
        const end = `${displayEndHour.toString().padStart(2, "0")}:00 ${endPeriod}`;

        return { id: `smart_${index}`, start, end };
    });
}

export const loadPreferences = loadSettings;
export const savePreferences = saveSettings;

// nome do ficheiro nao faz sentido nenhum eu sei, mas ja tava assim e ninguem mexeu


export const parseGS1 = (barcode) => {
    const parsedData = {};

    // tira prefixos de simbologia (tipo ]C1) que alguns scanners metem
    let remaining = barcode.replace(/^\]C1/, "");

    while (remaining.length > 0) {
        // ignora o Group Separator se for o primeiro char
        if (remaining.charCodeAt(0) === 29) {
            remaining = remaining.substring(1);
            continue;
        }

        // extrai GTIN (AI 01) - comprimento fixo de 14 dígitos
        if (remaining.startsWith("01")) {
            parsedData.gtin = remaining.substring(2, 16);
            remaining = remaining.substring(16);
        }
        // extrai data de validade (AI 17) - comprimento fixo de 6 dígitos
        else if (remaining.startsWith("17")) {
            const rawDate = remaining.substring(2, 8);
            const year = "20" + rawDate.substring(0, 2);
            const month = rawDate.substring(2, 4);
            const day = rawDate.substring(4, 6);

            parsedData.expiryDate = `${day}/${month}/${year}`;
            parsedData.rawExpiry = rawDate; // pode dar jeito guardar isto na BD tambem

            remaining = remaining.substring(8);
        }
        // extrai o Lote (AI 10) - comprimento variável
        else if (remaining.startsWith("10")) {
            // regex pra capturar até ao próximo separador
            const match = remaining.substring(2).match(/^([^\x1D]+)/);
            if (match) {
                parsedData.lot = match[1];
                remaining = remaining.substring(2 + match[1].length);
            } else {
                parsedData.lot = remaining.substring(2);
                remaining = "";
            }
        }
        // extrai o Número de Série (AI 21) - comprimento variável
        else if (remaining.startsWith("21")) {
            const match = remaining.substring(2).match(/^([^\x1D]+)/);
            if (match) {
                parsedData.serial = match[1];
                remaining = remaining.substring(2 + match[1].length);
            } else {
                parsedData.serial = remaining.substring(2);
                remaining = "";
            }
        }
        // extrai o Registo Nacional (AI 714)
        else if (remaining.startsWith("714")) {
            parsedData.cnp = remaining.substring(3, 10);
            remaining = remaining.substring(10);
        }
        // segurança: sai do loop se aparecer um AI desconhecido, senão fica preso pra sempre
        else {
            console.warn("Unsupported or parsing error in string:", remaining);
            break;
        }
    }

    return parsedData;
};
