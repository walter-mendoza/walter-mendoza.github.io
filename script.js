/**
 * SAN VALENTÍN - ÁRBOL ANIMADO Y CRONÓMETRO
 * Este script maneja la lógica completa de animación del canvas,
 * el sistema de partículas para las hojas del árbol y la sincronización de textos.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. CONFIGURACIÓN DEL CRONÓMETRO
    // ---------------------------------------------------------
    // Fecha exacta configurada: 29 de Diciembre del 2025 a las 00:00 horas
    // Nota: en JavaScript los meses van del 0 al 11, por eso Diciembre es 11
    const startDate = new Date(2025, 11, 29, 0, 0, 0);

    // ---------------------------------------------------------
    // 2. SELECCIÓN DE ELEMENTOS DEL DOM
    // ---------------------------------------------------------
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const mainScene = document.getElementById('main-scene');
    
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    const timerContainer = document.getElementById('timer-container');
    const timerText = document.getElementById('timer');
    
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');

    // Elemento de audio
    const bgMusic = document.getElementById('bg-music');

    // ---------------------------------------------------------
    // 3. VARIABLES DE ESTADO Y CANVAS
    // ---------------------------------------------------------
    let width, height;
    let animationFrameId;
    let leaves = []; // Aquí guardaremos las cientos de hojas
    let treeScale = 1;
    let trunkHeight = 0;
    let maxTrunkHeight = 0;
    
    // Paleta de colores para las hojas (rojos, rosados, granates)
    const leafColors = ['#e63946', '#ff4d6d', '#c9184a', '#ff758f', '#a01a58', '#800f2f', '#ffb3c1'];

    // Ajustar el canvas al tamaño del contenedor
    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width;
        canvas.height = height;
        
        // Escala basada en el tamaño de la pantalla (responsive)
        treeScale = Math.min(width, height) / 500;
        maxTrunkHeight = height * 0.35; // El tronco ocupa un 35% de la altura
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        // Si ya se generó el árbol, lo redibujamos estático en el nuevo tamaño
        if (leaves.length > 0 && trunkHeight >= maxTrunkHeight) {
            drawStaticScene();
        }
    });

    // ---------------------------------------------------------
    // 4. INICIO DE LA EXPERIENCIA
    // ---------------------------------------------------------
    startBtn.addEventListener('click', () => {
        // Reproducir la música al hacer clic (funciona en celular y PC)
        bgMusic.play().catch(e => console.log("Error al reproducir audio:", e));

        startScreen.style.opacity = '0';
        
        setTimeout(() => {
            startScreen.style.display = 'none';
            mainScene.classList.remove('hidden');
            resizeCanvas();
            
            // Iniciar la secuencia de animación
            startAnimationSequence();
        }, 1000);
    });

    // ---------------------------------------------------------
    // 5. SECUENCIADOR DE ANIMACIONES
    // ---------------------------------------------------------
    function startAnimationSequence() {
        // Fase 1: Crece el tronco
        growTrunk(() => {
            // Fase 2: Generar y hacer aparecer las hojas densas
            generateDenseLeaves();
            animateLeaves(() => {
                // Fase 3: Mostrar textos cuando el árbol esté listo
                showTexts();
            });
        });
    }

    function showTexts() {
        setTimeout(() => { line1.classList.add('show-text'); }, 500);
        setTimeout(() => { line2.classList.add('show-text'); }, 2500);
        setTimeout(() => { 
            timerContainer.classList.add('show-text'); 
            startTimer();
        }, 4500);
    }

    // ---------------------------------------------------------
    // 6. MOTOR DE DIBUJO DEL ÁRBOL
    // ---------------------------------------------------------

    // Función para dibujar el tronco base y ramas principales
    function drawTrunk(currentHeight) {
        ctx.save();
        ctx.translate(width / 2, height * 0.95); // Iniciar desde casi abajo
        
        ctx.fillStyle = '#4a3022'; // Marrón oscuro
        ctx.beginPath();
        
        // Base más ancha
        const baseWidth = 30 * treeScale;
        const topWidth = 10 * treeScale;
        
        ctx.moveTo(-baseWidth / 2, 0);
        ctx.lineTo(baseWidth / 2, 0);
        ctx.lineTo(topWidth / 2, -currentHeight);
        ctx.lineTo(-topWidth / 2, -currentHeight);
        ctx.fill();

        // Pequeñas ramas secundarias saliendo del tronco
        if (currentHeight > maxTrunkHeight * 0.5) {
            ctx.lineWidth = 6 * treeScale;
            ctx.strokeStyle = '#4a3022';
            ctx.lineCap = 'round';
            
            // Rama izquierda
            ctx.beginPath();
            ctx.moveTo(0, -currentHeight * 0.6);
            ctx.quadraticCurveTo(-40 * treeScale, -currentHeight * 0.8, -60 * treeScale, -currentHeight * 0.9);
            ctx.stroke();

            // Rama derecha
            ctx.beginPath();
            ctx.moveTo(0, -currentHeight * 0.7);
            ctx.quadraticCurveTo(50 * treeScale, -currentHeight * 0.85, 70 * treeScale, -currentHeight * 1.0);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // Animación de crecimiento del tronco
    function growTrunk(callback) {
        trunkHeight += 2; // Velocidad de crecimiento
        
        ctx.clearRect(0, 0, width, height);
        drawTrunk(trunkHeight);
        
        if (trunkHeight < maxTrunkHeight) {
            requestAnimationFrame(() => growTrunk(callback));
        } else {
            callback();
        }
    }

    // ---------------------------------------------------------
    // 7. SISTEMA DE HOJAS DENSAS (FORMA DE CORAZÓN)
    // ---------------------------------------------------------

    // Clase para cada hoja individual
    class Leaf {
        constructor(x, y, color, size, isHeart) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.targetSize = size;
            this.currentSize = 0; // Inicia invisible
            this.isHeart = isHeart; // Define si dibuja un punto o un corazoncito
            this.growthSpeed = 0.1 + Math.random() * 0.2;
            this.delay = Math.random() * 60; // Retraso para que no aparezcan de golpe
            this.wobbleOffset = Math.random() * Math.PI * 2;
        }

        update() {
            if (this.delay > 0) {
                this.delay--;
            } else if (this.currentSize < this.targetSize) {
                this.currentSize += this.growthSpeed;
            }
        }

        draw(ctx) {
            if (this.currentSize <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Pequeña oscilación suave
            const wobble = Math.sin(Date.now() * 0.002 + this.wobbleOffset) * 0.05;
            ctx.scale(this.currentSize + wobble, this.currentSize + wobble);

            ctx.fillStyle = this.color;

            if (this.isHeart) {
                // Dibujar mini corazón
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(-2, -2, -4, 1, 0, 4);
                ctx.bezierCurveTo(4, 1, 2, -2, 0, 0);
                ctx.fill();
            } else {
                // Dibujar punto circular (palpitante lento)
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // Generar las coordenadas de las hojas usando la ecuación matemática de un corazón
    function generateDenseLeaves() {
        const numLeaves = 1500; // Alta densidad para que se vea tupido
        const centerX = width / 2;
        const centerY = height * 0.95 - maxTrunkHeight - (50 * treeScale); // Encima del tronco
        const heartScale = 12 * treeScale;

        for (let i = 0; i < numLeaves; i++) {
            // Ecuación paramétrica del corazón para distribuir puntos
            // Distribuimos puntos al azar, pero filtrados por la forma del corazón
            let t = Math.random() * Math.PI * 2;
            let radiusVariation = Math.random(); // Para rellenar el interior
            
            // Fórmula matemática del corazón
            let hx = 16 * Math.pow(Math.sin(t), 3);
            let hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            
            // Invertimos Y y escalamos
            let x = centerX + (hx * heartScale * Math.sqrt(radiusVariation));
            let y = centerY - (hy * heartScale * Math.sqrt(radiusVariation));
            
            // Añadir un poco de ruido para bordes más orgánicos
            x += (Math.random() - 0.5) * 20 * treeScale;
            y += (Math.random() - 0.5) * 20 * treeScale;

            const color = leafColors[Math.floor(Math.random() * leafColors.length)];
            const size = (1.5 + Math.random() * 2.5) * treeScale;
            const isHeartShape = Math.random() > 0.5; // Mitad corazones, mitad puntos

            leaves.push(new Leaf(x, y, color, size, isHeartShape));
        }
    }

    // Bucle de animación para que las hojas crezcan y palpiten
    function animateLeaves(callback) {
        ctx.clearRect(0, 0, width, height);
        drawTrunk(maxTrunkHeight); // Redibujar tronco base
        
        let allGrown = true;
        
        for (let leaf of leaves) {
            leaf.update();
            leaf.draw(ctx);
            if (leaf.currentSize < leaf.targetSize) {
                allGrown = false;
            }
        }

        // Seguir animando indefinidamente para mantener la palpitación
        requestAnimationFrame(() => animateLeaves(callback));
        
        // Pero disparar el callback de los textos solo una vez cuando ya crecieron
        if (allGrown && callback && !callback.called) {
            callback.called = true;
            callback();
        }
    }

    // Redibujado estático (útil al cambiar tamaño de ventana)
    function drawStaticScene() {
        ctx.clearRect(0, 0, width, height);
        drawTrunk(maxTrunkHeight);
        for (let leaf of leaves) {
            leaf.draw(ctx);
        }
    }

    // ---------------------------------------------------------
    // 8. LÓGICA DEL CRONÓMETRO
    // ---------------------------------------------------------
    function startTimer() {
        function update() {
            const now = new Date();
            const diff = now - startDate;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            // Formateador para añadir ceros a la izquierda (ej: 08 en lugar de 8)
            const formatStr = (num) => String(num).padStart(2, '0');

            timerText.innerHTML = `${days} días ${formatStr(hours)} horas ${formatStr(minutes)} minutos ${formatStr(seconds)} segundos`;
        }

        // Actualizar inmediatamente y luego cada segundo
        update();
        setInterval(update, 1000);
    }
});