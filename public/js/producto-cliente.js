import { initFirebase, setupNavigation } from "./common.js";
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
                window.location.href = '/login.html';
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

    // --- Breadcrumbs ---
    const breadcrumbCategory = view.getElementById('breadcrumb-category');
    if (breadcrumbCategory) breadcrumbCategory.textContent = product.category || 'Categoría';
    const breadcrumbProduct = view.getElementById('breadcrumb-product');
    if (breadcrumbProduct) breadcrumbProduct.textContent = product.name || 'Producto';

    // --- Product Info ---
    const categoryEl = view.getElementById('product-category');
    if (categoryEl) categoryEl.textContent = product.category || 'Sin categoría';
    
    const nameEl = view.getElementById('product-name');
    if (nameEl) nameEl.textContent = product.name || 'Nombre no disponible';

    const priceEl = view.getElementById('product-price');
    const priceValue = Number(product.price);
    const safePrice = Number.isFinite(priceValue) ? priceValue : 0;
    if (priceEl) priceEl.textContent = `S/ ${safePrice.toFixed(2)}`;

    const originalPriceEl = view.getElementById('product-original-price');
    const discountBadgeEl = view.getElementById('discount-badge');
    const originalPriceValue = Number(product.originalPrice);
    const hasDiscount = Number.isFinite(originalPriceValue) && originalPriceValue > safePrice;
    if (hasDiscount) {
        if (originalPriceEl) originalPriceEl.textContent = `S/ ${originalPriceValue.toFixed(2)}`;
        if (discountBadgeEl) discountBadgeEl.classList.remove('hidden');
    } else {
        if (originalPriceEl) originalPriceEl.remove();
        if (discountBadgeEl) discountBadgeEl.remove();
    }
    // --- Description ---
    let description = product.description || 'No hay descripción disponible.';
    if (description.includes('<li>') && !description.includes('<ul>') && !description.includes('<ol>')) {
        description = '<ul>' + description + '</ul>';
    }
    const descriptionEl = view.getElementById('product-description');
    if (descriptionEl) descriptionEl.innerHTML = description;

    // --- Main Image LCP ---
    const mainImg = view.getElementById('main-product-image');
    if (mainImg) {
        const url = product.imageUrl || 'https://placehold.co/600x600/f0f0f0/333?text=Sin+Imagen';
        mainImg.src = url;
        mainImg.loading = 'eager';
        mainImg.decoding = 'async';
    }

    // --- Stock Logic ---
    const stockContainer = view.getElementById('product-stock-container');
    const stockElement = view.getElementById('product-stock');
    const whatsappLink = view.getElementById('whatsapp-link');
    const whatsappLinkAna = view.getElementById('whatsapp-link-ana');
    const stock = product.stock || 0;

    if (stockElement && stockContainer) {
        stockContainer.classList.remove('animate-pulse');
        let stockText, stockClasses, iconClasses;

        if (stock > 10) {
            stockText = 'En Stock';
            stockClasses = 'stock-badge stock-available';
            iconClasses = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
        } else if (stock > 0) {
            stockText = `¡Solo quedan ${stock}!`;
            stockClasses = 'stock-badge stock-low';
            iconClasses = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        } else {
            stockText = 'Agotado';
            stockClasses = 'stock-badge stock-out';
            iconClasses = 'w-2 h-2 bg-red-500 rounded-full';
        }
        
        stockElement.className = stockClasses;
        stockElement.innerHTML = `
            <div class="${iconClasses}"></div>
            <span>${stockText}</span>
        `;
    }

    if (stock <= 0) {
        [whatsappLink, whatsappLinkAna].forEach(link => {
            if (link) {
                link.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                link.removeAttribute('href');
            }
        });
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
    if (whatsappLink) {
        whatsappLink.href = `https://wa.me/${phoneNumberMilka}?text=${encodedMessage}`;
        whatsappLink.innerHTML = `
            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <span>Contactar a Milka</span>
        `;
    }
    
    if (whatsappLinkAna) {
        whatsappLinkAna.href = `https://wa.me/${phoneNumberAna}?text=${encodedMessage}`;
        whatsappLinkAna.innerHTML = `
            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <span>Contactar a Ana</span>
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
