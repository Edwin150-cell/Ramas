// Contenedores del DOM
const expresion = document.getElementById("expresion");
const arbol = document.getElementById("arbol");
const resultado = document.getElementById("resultado");
const errorMsg = document.getElementById("error-msg");
const btnGenerar = document.getElementById("btn-generar");

let lineas = [];

class NodoArbol {
    constructor(valor) {
        this.valor = valor;
        this.izq = null;
        this.der = null;
        this.id = "nodo-" + Math.random().toString(36).substr(2, 9);
    }
}

const limpiarLineas = () => {
    lineas.forEach(linea => linea && linea.remove());
    lineas = [];
};

// Mantiene únicamente el filtro de caracteres en el input
expresion.addEventListener("input", (e) => {
    expresion.value = expresion.value.replace(/[^0-9+\-*/()\s]/g, "");
});

// se realiza al presionar el botón para generar el árbol
btnGenerar.addEventListener("click", () => {
    dibujar_arbol(expresion.value);
});

const tokenizar = (str) => {
    const regex = /\d+(\.\d+)?|[\+\-\*\/\(\)]/g;
    return str.match(regex) || [];
};

const construirArbol = (tokens) => {
    const nodos = [];
    const ops = [];
    const precedencia = { '+': 1, '-': 1, '*': 2, '/': 2 };

    const procesarOperador = () => {
        const op = ops.pop();
        const der = nodos.pop();
        const izq = nodos.pop();
        if (!izq || !der) throw new Error("Expresión mal formada");
        const nodoOp = new NodoArbol(op);
        nodoOp.izq = izq;
        nodoOp.der = der;
        nodos.push(nodoOp);
    };

    for (let token of tokens) {
        if (!isNaN(parseFloat(token))) {
            nodos.push(new NodoArbol(token));
        } else if (token === '(') {
            ops.push(token);
        } else if (token === ')') {
            while (ops.length > 0 && ops[ops.length - 1] !== '(') {
                procesarOperador();
            }
            if (ops.length === 0) throw new Error("Paréntesis desbalanceados");
            ops.pop();
        } else if (precedencia[token]) {
            while (
                ops.length > 0 &&
                ops[ops.length - 1] !== '(' &&
                precedencia[ops[ops.length - 1]] >= precedencia[token]
            ) {
                procesarOperador();
            }
            ops.push(token);
        }
    }

    while (ops.length > 0) {
        if (ops[ops.length - 1] === '(') throw new Error("Paréntesis desbalanceados");
        procesarOperador();
    }

    if (nodos.length !== 1) throw new Error("Sintaxis incorrecta");
    return nodos[0];
};

// Dibuja el árbol en pantalla y calcula el resultado
const dibujar_arbol = (expresionInput) => {
    limpiarLineas();
    arbol.innerHTML = "";
    if (errorMsg) errorMsg.innerText = "";
    resultado.innerText = "";

    const inputLimpio = expresionInput.trim();
    if (!inputLimpio) return;

    const tokens = tokenizar(inputLimpio);
    const numOperaciones = tokens.filter(t => ['+', '-', '*', '/'].includes(t)).length;

    if (numOperaciones === 0) return;

    if (numOperaciones > 6) {
        if (errorMsg) {
            errorMsg.innerText = `Límite alcanzado: solo se permiten hasta 6 operaciones (tienes ${numOperaciones}).`;
        }
        return;
    }

    try {
        const raiz = construirArbol(tokens);

        const niveles = [];
        const obtenerNiveles = (nodo, nivel = 0) => {
            if (!nodo) return;
            if (!niveles[nivel]) niveles[nivel] = [];
            niveles[nivel].push(nodo);
            obtenerNiveles(nodo.izq, nivel + 1);
            obtenerNiveles(nodo.der, nivel + 1);
        };
        obtenerNiveles(raiz);

        let htmlContenido = "";
        niveles.forEach((nivelNodos) => {
            htmlContenido += `<div class="row justify-content-around my-4">`;
            nivelNodos.forEach(nodo => {
                const esOperador = ['+', '-', '*', '/'].includes(nodo.valor);
                const colorBg = esOperador ? 'bg-warning' : 'bg-success text-white';
                htmlContenido += `
                    <div class="col-auto text-center">
                        <p id="${nodo.id}" class="${colorBg} rounded-circle fw-bold d-inline-block m-0" style="width:60px;height:60px;line-height:60px;">
                            ${nodo.valor}
                        </p>
                    </div>
                `;
            });
            htmlContenido += `</div>`;
        });

        arbol.innerHTML = htmlContenido;

        setTimeout(() => {
            conectarLeaderLines(raiz);
        }, 50);

        try {
            const valor = eval(expresionInput);
            resultado.innerText = `Resultado: ${valor}`;
        } catch {
            resultado.innerText = "Resultado: inválido";
        }

    } catch (e) {
        if (errorMsg) errorMsg.innerText = "Error: " + e.message;
    }
};

// Conecta recursivamente cada nodo con sus hijos
const conectarLeaderLines = (nodo) => {
    if (!nodo) return;
    if (nodo.izq) {
        trazarLinea(nodo.id, nodo.izq.id);
        conectarLeaderLines(nodo.izq);
    }
    if (nodo.der) {
        trazarLinea(nodo.id, nodo.der.id);
        conectarLeaderLines(nodo.der);
    }
};

const trazarLinea = (idOrigen, idDestino) => {
    const elOrigen = document.getElementById(idOrigen);
    const elDestino = document.getElementById(idDestino);
    if (elOrigen && elDestino) {
        const linea = new LeaderLine(elOrigen, elDestino, {
            startPlug: 'arrow1',
            endPlug: 'arrow2',
            color: '#555',
            size: 3,
            path: 'straight'
        });
        lineas.push(linea);
    }
};