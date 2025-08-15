import { initFirebase, setupNavigation, registerServiceWorker } from "./common.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

let db, auth;

// Utilidad: obtener productId de URL (?id=) o de la ruta
function resolveProductId() {
    const params = new URLSearchParams(window.location.search);
    let productId = params.get('id');
    if (!productId) {
        const pathParts = window.location.pathname.split('/');
        productId = pathParts[pathParts.length - 1];
    }
    if (productId === 'producto.html') return null;
    return productId;
}

// Pintar datos mínimos (prefetch) si existen en sessionStorage
function renderFromSessionIfAvailable(productId) {
    try {
        const raw = sessionStorage.getItem(`product:${productId}`);
        if (!raw) return false;
        const product = JSON.parse(raw);
        if (!product || !product.id) return false;
        displayProduct(product);
        return true;
    } catch {
        return false;
    }
}

function cleanEscapedContent() {
    // Remover elementos de lista sueltos
    const escapedLis = document.body.querySelectorAll('body > li');
    escapedLis.forEach(li => li.remove());
    
    // Remover nodos de texto sueltos que contengan texto de descripción
    const textNodes = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        // Si el nodo de texto está directamente en el body y contiene texto de descripción
        if (node.parentNode === document.body) {
            const text = node.textContent.trim();
            if (text.includes('Puertas de Acrílico') || 
                text.includes('Paneles de plástico') || 
                text.includes('Conectores ABS') ||
                text.includes('Marco de puerta') ||
                text.includes('Mueble apilable') ||
                text.includes('Cada Cubo') ||
                text.includes('Almacena hasta') ||
                text.length > 10) { // Cualquier texto largo que no debería estar en el body
                textNodes.push(node);
            }
        }
    }
    
    // Remover los nodos de texto encontrados
    textNodes.forEach(node => node.remove());
}

async function main() {
    try {
        // Limpiar cualquier contenido escapado al cargar (diferido)
        requestIdleCallback?.(cleanEscapedContent) ?? setTimeout(cleanEscapedContent, 0);

        // Resolver productId y pintar skeleton ya viene desde HTML; intentar render instantáneo con sessionStorage
        const productId = resolveProductId();

        const app = await initFirebase();
        db = getFirestore(app);
        auth = getAuth(app);

        setupNavigation();
        registerServiceWorker();

        // Intentar render inmediato desde sessionStorage (si venimos de la lista)
        if (productId) {
            renderFromSessionIfAvailable(productId);
            // Paralelamente cargar datos reales
            loadProduct(productId).catch(err => console.error('Error carga producto:', err));
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                setupUserControls(user);
            } else {
                // Si no autenticado, redirigir pero permitir ver skeleton en lo que se redirige
                window.location.href = '/login-cliente.html';
            }
        });
    } catch (error) {
        console.error("❌ Error en la inicialización:", error);
    }
}

function setupUserControls(user) {
    const userControlsDiv = document.getElementById('user-controls');
    if (!userControlsDiv) return;
    userControlsDiv.innerHTML = `
        <div class="text-right">
            <p class="text-sm font-medium text-gray-800">${user.displayName || user.email}</p>
            <button id="logout-button" class="text-xs text-gray-500 hover:underline">Cerrar Sesión</button>
        </div>
    `;
    document.getElementById('logout-button').addEventListener('click', () => signOut(auth));
}

async function loadProduct(productId) {
    const loadingMessage = document.getElementById('loading-message');

    if (!productId) {
        if (loadingMessage) loadingMessage.innerText = 'Error: No se especificó un ID de producto.';
        return;
    }

    try {
        const productRef = doc(db, "products", productId);
        const t0 = performance.now();
        const docSnap = await getDoc(productRef);
        const t1 = performance.now();

        if (docSnap.exists()) {
            const productData = { id: docSnap.id, ...docSnap.data() };

            // Guardar snapshot mínimo para navegaciones siguientes (perf percibido)
            try {
                const minimal = {
                    id: productData.id,
                    name: productData.name,
                    price: productData.price,
                    category: productData.category,
                    imageUrl: productData.imageUrl,
                    imageUrl2: productData.imageUrl2,
                    imageUrl3: productData.imageUrl3,
                    imageUrl4: productData.imageUrl4,
                    description: productData.description,
                    originalPrice: productData.originalPrice,
                    stock: productData.stock,
                    code: productData.code
                };
                sessionStorage.setItem(`product:${productId}`, JSON.stringify(minimal));
            } catch {}

            updateMetaTagsForProduct(productData);
            displayProduct(productData);

            console.log(`⏱️ Firestore getDoc(${productId}) ${Math.round(t1 - t0)}ms`);
        } else {
            if (loadingMessage) loadingMessage.innerText = 'Producto no encontrado.';
        }
    } catch (error) {
        console.error("Error al cargar el producto:", error);
    }
}

function updateMetaTagsForProduct(product) {
    document.title = `${product.name} - BRAHOLET Importaciones`;
    
    const setMetaTag = (property, content) => {
        let element = document.querySelector(`meta[property='${property}']`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMetaTag('og:title', product.name);
    // Limpiar HTML de la descripción para las meta tags
    const cleanDescriptionForMeta = (product.description || 'Consulta este increíble producto en BRAHOLET Importaciones.')
        .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim(); // Remover espacios al inicio y final
    setMetaTag('og:description', cleanDescriptionForMeta);
    setMetaTag('og:image', product.imageUrl);
    setMetaTag('og:url', window.location.href);
    setMetaTag('og:type', 'product');
}

function displayProduct(product) {
    // Limpiar contenido escapado antes de mostrar el producto
    cleanEscapedContent();
    
    const productContent = document.getElementById('product-content');
    const template = document.getElementById('product-view-template');
    if (!productContent || !template) return;

    const view = template.content.cloneNode(true);

    view.getElementById('main-product-image').src = product.imageUrl || 'https://placehold.co/600x600/f0f0f0/333?text=Sin+Imagen';
    view.getElementById('main-product-image').alt = product.name;

    const gallery = view.getElementById('thumbnail-gallery');
    const images = [product.imageUrl, product.imageUrl2, product.imageUrl3, product.imageUrl4].filter(Boolean);

    // Helper para construir srcset simple (si el backend sirve escalas coherentes, ajustar aquí)
    const buildSrcSet = (u) => {
        if (!u) return '';
        // Ejemplo básico: misma URL para distintos descriptors para permitir downscale
        return `${u} 800w`;
    };

    if (images.length > 1 && gallery) {
        images.forEach((url, index) => {
            const img = document.createElement('img');
            img.src = index === 0 ? url : ''; // de-ferremos carga real
            img.dataset.src = url;
            img.alt = `Vista en miniatura ${index + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.width = 160;
            img.height = 160;
            img.srcset = buildSrcSet(url);
            img.sizes = '(max-width: 640px) 25vw, 160px';
            img.className = 'w-full h-full object-cover rounded-md thumbnail-image cursor-pointer';
            if (index === 0) img.classList.add('active');
            img.addEventListener('click', (event) => {
                const main = document.getElementById('main-product-image');
                if (main) {
                    main.src = url;
                    main.srcset = buildSrcSet(url);
                    main.sizes = '(min-width: 1024px) 50vw, 100vw';
                    main.decoding = 'async';
                    main.loading = 'eager';
                }
                document.querySelectorAll('.thumbnail-image').forEach(thumb => thumb.classList.remove('active'));
                event.target.classList.add('active');
            });
            gallery.appendChild(img);
        });

        // Lazy cargar thumbnails que no sean el primero
        const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const el = e.target;
                    if (el.dataset && el.dataset.src) {
                        el.src = el.dataset.src;
                        delete el.dataset.src;
                    }
                    obs.unobserve(el);
                }
            });
        }, { rootMargin: '100px' }) : null;

        if (io) {
            gallery.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
        } else {
            // fallback
            gallery.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; delete img.dataset.src; });
        }
    } else {
        if (gallery) gallery.remove();
    }

    view.getElementById('product-category').textContent = product.category || 'Sin categoría';
    view.getElementById('product-name').textContent = product.name || 'Nombre no disponible';
    view.getElementById('product-price').textContent = `S/ ${(product.price || 0).toFixed(2)}`;
    
    const originalPriceEl = view.getElementById('product-original-price');
    if (product.originalPrice && product.originalPrice > product.price) {
        originalPriceEl.textContent = `S/ ${product.originalPrice.toFixed(2)}`;
    } else {
        if(originalPriceEl) originalPriceEl.remove();
    }

    // Sanitizar y corregir la descripción HTML antes de insertarla
    let description = product.description || 'No hay descripción disponible.';
    
    // Detectar si hay elementos <li> sueltos sin contenedor <ul> o <ol>
    if (description.includes('<li>') && !description.includes('<ul>') && !description.includes('<ol>')) {
        // Envolver todos los <li> en un <ul>
        description = '<ul>' + description + '</ul>';
    }
    
    // Limpiar cualquier HTML mal formado
    description = description
        .replace(/(<li[^>]*>)/gi, '<li>') // Normalizar etiquetas <li>
        .replace(/(<\/li>)/gi, '</li>') // Normalizar etiquetas </li>
        .replace(/([^>])\s*<li>/gi, '$1</li><li>') // Asegurar cierre de <li> anterior
        .replace(/^<li>/, '<ul><li>') // Agregar <ul> al inicio si empieza con <li>
        .replace(/<\/li>$/, '</li></ul>'); // Agregar </ul> al final si termina con </li>
    
    view.getElementById('product-description').innerHTML = description;
    // Establecer atributos del main image para LCP
    const mainImg = view.getElementById('main-product-image');
    if (mainImg) {
        const url = product.imageUrl || 'https://placehold.co/600x600/f0f0f0/333?text=Sin+Imagen';
        mainImg.src = url;
        mainImg.srcset = `${url} 800w`;
        mainImg.sizes = '(min-width: 1024px) 50vw, 100vw';
        mainImg.loading = 'eager';
        mainImg.decoding = 'async';
        mainImg.width = 800;
        mainImg.height = 800;
    }

    const stockElement = view.getElementById('product-stock');
    const whatsappLink = view.getElementById('whatsapp-link');
    const whatsappLinkAna = view.getElementById('whatsapp-link-ana');
    
    // ✨ DEBUG: Verificar si los elementos existen ✨
    console.log('whatsappLink:', whatsappLink);
    console.log('whatsappLinkAna:', whatsappLinkAna);
    console.log('Template completo:', template.innerHTML);
    
    const stock = product.stock || 0;
    if (stock > 0) {
        stockElement.textContent = stock > 10 ? '✅ En Stock' : `⚠️ ¡Últimas ${stock} unidades!`;
        stockElement.className = stock > 10 ? 'mt-2 text-sm font-semibold text-green-600' : 'mt-2 text-sm font-semibold text-yellow-600';
    } else {
        stockElement.textContent = '❌ Agotado';
        stockElement.className = 'mt-2 text-sm font-semibold text-red-600';
        whatsappLink.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed', 'pointer-events-none');
        whatsappLink.setAttribute('disabled', true);
        if (whatsappLinkAna) {
            whatsappLinkAna.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed', 'pointer-events-none');
            whatsappLinkAna.setAttribute('disabled', true);
        }
    }
    
    // ✨ LÓGICA FINAL DE LOS BOTONES DE WHATSAPP CON CACHE BUSTER ✨
    const phoneNumberMilka = '51938256218';
    const phoneNumberAna = '51931257162';
    const textMessage = `Hola, estoy interesado en el producto *${product.name}* (COD: ${product.code || 'N/A'}).\n\nEste es el enlace para más detalles:`;
    
    // Determinar URL base según el método de acceso (parámetro o ruta)
    let baseUrl;
    const params = new URLSearchParams(window.location.search);
    if (params.get('id')) {
        // Método con parámetro ?id=
        baseUrl = window.location.origin + window.location.pathname + `?id=${product.id}`;
        const productPageURLWithCacheBuster = `${baseUrl}&v=${Date.now()}`;
        const fullMessage = `${textMessage}\n${productPageURLWithCacheBuster}`;
        var encodedMessage = encodeURIComponent(fullMessage);
    } else {
        // Método con ruta dinámica
        baseUrl = window.location.origin + window.location.pathname;
        const productPageURLWithCacheBuster = `${baseUrl}?v=${Date.now()}`;
        const fullMessage = `${textMessage}\n${productPageURLWithCacheBuster}`;
        var encodedMessage = encodeURIComponent(fullMessage);
    }
    
    // Configurar botón de Milka
    whatsappLink.href = `https://wa.me/${phoneNumberMilka}?text=${encodedMessage}`;
    whatsappLink.innerHTML = `
        <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 14.2l-1.5-0.8c-0.4-0.2-0.7-0.1-0.9 0.2l-0.5 0.6c-0.2 0.2-0.5 0.3-0.8 0.2C11.9 14 11 13.2 10.1 12.2c-0.9-0.9-1.7-1.8-1.9-2.8 0-0.3 0.1-0.6 0.3-0.8l0.6-0.5c0.2-0.2 0.3-0.5 0.2-0.9l-0.8-1.5c-0.2-0.4-0.6-0.6-1-0.6H5.7C5.3 4 5 4.3 5 4.7c0 0.9 0.3 1.8 0.9 2.6 0.6 0.8 1.4 1.6 2.3 2.4 1.2 1.1 2.6 2 4.2 2.4 0.2 0 0.3 0 0.5 0 0.8 0 1.6-0.3 2.2-0.9 0.6-0.6 1-1.4 1-2.2 0-0.4-0.3-0.7-0.7-0.7h-1.4c-0.4 0-0.8 0.2-1 0.6zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/></svg>
        <div class="text-center">
            <div>Asesora Milka
</div>
        </div>
    `;
    
    // ✨ FORZAR CREACIÓN DE LA ESTRUCTURA COMPLETA ✨
    // Si no existe el segundo botón, creamos toda la estructura desde cero
    if (!whatsappLinkAna) {
        console.log('Recreando estructura completa con ambos botones...');
        
        // Buscar el contenedor del botón
        const buttonContainer = whatsappLink.parentElement;
        
        // Crear nueva estructura completa
        buttonContainer.innerHTML = `
            <!-- Título para los asesores -->
            <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">Comunícate con nuestras asesoras:
</h3>
            
            <!-- Contenedor para los dos botones -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Botón Milka -->
                <a id="whatsapp-link-milka" href="https://wa.me/${phoneNumberMilka}?text=${encodedMessage}" target="_blank" class="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl">
                    <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 14.2l-1.5-0.8c-0.4-0.2-0.7-0.1-0.9 0.2l-0.5 0.6c-0.2 0.2-0.5 0.3-0.8 0.2C11.9 14 11 13.2 10.1 12.2c-0.9-0.9-1.7-1.8-1.9-2.8 0-0.3 0.1-0.6 0.3-0.8l0.6-0.5c0.2-0.2 0.3-0.5 0.2-0.9l-0.8-1.5c-0.2-0.4-0.6-0.6-1-0.6H5.7C5.3 4 5 4.3 5 4.7c0 0.9 0.3 1.8 0.9 2.6 0.6 0.8 1.4 1.6 2.3 2.4 1.2 1.1 2.6 2 4.2 2.4 0.2 0 0.3 0 0.5 0 0.8 0 1.6-0.3 2.2-0.9 0.6-0.6 1-1.4 1-2.2 0-0.4-0.3-0.7-0.7-0.7h-1.4c-0.4 0-0.8 0.2-1 0.6zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/></svg>
                    <div class="text-center">
                        <div>Asesora Milka</div>
                    </div>
                </a>

                <!-- Botón Ana -->
                <a id="whatsapp-link-ana-new" href="https://wa.me/${phoneNumberAna}?text=${encodedMessage}" target="_blank" class="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl">
                    <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 14.2l-1.5-0.8c-0.4-0.2-0.7-0.1-0.9 0.2l-0.5 0.6c-0.2 0.2-0.5 0.3-0.8 0.2C11.9 14 11 13.2 10.1 12.2c-0.9-0.9-1.7-1.8-1.9-2.8 0-0.3 0.1-0.6 0.3-0.8l0.6-0.5c0.2-0.2 0.3-0.5 0.2-0.9l-0.8-1.5c-0.2-0.4-0.6-0.6-1-0.6H5.7C5.3 4 5 4.3 5 4.7c0 0.9 0.3 1.8 0.9 2.6 0.6 0.8 1.4 1.6 2.3 2.4 1.2 1.1 2.6 2 4.2 2.4 0.2 0 0.3 0 0.5 0 0.8 0 1.6-0.3 2.2-0.9 0.6-0.6 1-1.4 1-2.2 0-0.4-0.3-0.7-0.7-0.7h-1.4c-0.4 0-0.8 0.2-1 0.6zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/></svg>
                    <div class="text-center">
                        <div>Asesora Ana</div>
                    </div>
                </a>
            </div>
        `;
        
        // Si no hay stock, deshabilitar ambos botones
        if (stock <= 0) {
            const milkaBtn = buttonContainer.querySelector('#whatsapp-link-milka');
            const anaBtn = buttonContainer.querySelector('#whatsapp-link-ana-new');
            
            [milkaBtn, anaBtn].forEach(btn => {
                if (btn) {
                    btn.classList.add('bg-gray-400', 'cursor-not-allowed', 'pointer-events-none');
                    btn.removeAttribute('href');
                }
            });
        }
    } else {
        // Configurar botón de Ana (caso normal)
        whatsappLinkAna.href = `https://wa.me/${phoneNumberAna}?text=${encodedMessage}`;
        whatsappLinkAna.innerHTML = `
            <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 14.2l-1.5-0.8c-0.4-0.2-0.7-0.1-0.9 0.2l-0.5 0.6c-0.2 0.2-0.5 0.3-0.8 0.2C11.9 14 11 13.2 10.1 12.2c-0.9-0.9-1.7-1.8-1.9-2.8 0-0.3 0.1-0.6 0.3-0.8l0.6-0.5c0.2-0.2 0.3-0.5 0.2-0.9l-0.8-1.5c-0.2-0.4-0.6-0.6-1-0.6H5.7C5.3 4 5 4.3 5 4.7c0 0.9 0.3 1.8 0.9 2.6 0.6 0.8 1.4 1.6 2.3 2.4 1.2 1.1 2.6 2 4.2 2.4 0.2 0 0.3 0 0.5 0 0.8 0 1.6-0.3 2.2-0.9 0.6-0.6 1-1.4 1-2.2 0-0.4-0.3-0.7-0.7-0.7h-1.4c-0.4 0-0.8 0.2-1 0.6zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/></svg>
            <div class="text-center">
                <div>Asesora Ana</div>
            </div>
        `;
    }

    productContent.innerHTML = '';
    productContent.appendChild(view);

    // Limpiar cualquier contenido que se haya escapado al body (diferido e idempotente)
    const cleanup = () => {
        // Remover elementos de lista sueltos
        const escapedLis = document.body.querySelectorAll('body > li');
        escapedLis.forEach(li => li.remove());
        
        // Remover nodos de texto sueltos que contengan texto de la descripción
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            // Si el nodo de texto está directamente en el body y contiene texto de descripción
            if (node.parentNode === document.body) {
                const text = node.textContent.trim();
                if (text.includes('Puertas de Acrílico') || 
                    text.includes('Paneles de plástico') || 
                    text.includes('Conectores ABS') ||
                    text.includes('Marco de puerta') ||
                    text.includes('Mueble apilable') ||
                    text.includes('Cada Cubo') ||
                    text.includes('Almacena hasta')) {
                    textNodes.push(node);
                }
            }
        }
        
        // Remover los nodos de texto encontrados
    textNodes.forEach(node => node.remove());
    
};
(window.requestIdleCallback ? requestIdleCallback(cleanup) : setTimeout(cleanup, 100));
}
 
main();
