import { initFirebase, setupNavigation, registerServiceWorker } from "./common.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

let db, auth;

async function main() {
    try {
        const app = await initFirebase();
        db = getFirestore(app);
        auth = getAuth(app);

        setupNavigation();
        registerServiceWorker();

        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.body.style.opacity = '1';
                setupUserControls(user);
                loadProduct();
            } else {
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

async function loadProduct() {
    const loadingMessage = document.getElementById('loading-message');
    
    // ✨ CAMBIO IMPORTANTE AQUÍ ✨
    // Obtenemos el ID del producto desde la ruta de la URL, no de un parámetro ?id=
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
        if(loadingMessage) loadingMessage.innerText = 'Error: No se especificó un ID de producto.';
        return;
    }

    try {
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
            displayProduct(docSnap.data());
        } else {
            if(loadingMessage) loadingMessage.innerText = 'Producto no encontrado.';
        }
    } catch (error) {
        console.error("Error al cargar el producto:", error);
    }
}

function displayProduct(product) {
    const productContent = document.getElementById('product-content');
    const template = document.getElementById('product-view-template');
    if (!productContent || !template) return;

    const view = template.content.cloneNode(true);

    view.getElementById('main-product-image').src = product.imageUrl || 'https://placehold.co/600x600/f0f0f0/333?text=Sin+Imagen';
    view.getElementById('main-product-image').alt = product.name;

    const gallery = view.getElementById('thumbnail-gallery');
    const images = [product.imageUrl, product.imageUrl2, product.imageUrl3, product.imageUrl4].filter(Boolean);
    
    if (images.length > 1) {
        images.forEach((url, index) => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Vista en miniatura ${index + 1}`;
            img.className = 'w-full h-full object-cover rounded-md thumbnail-image cursor-pointer';
            if (index === 0) img.classList.add('active');
            img.addEventListener('click', (event) => {
                document.getElementById('main-product-image').src = url;
                document.querySelectorAll('.thumbnail-image').forEach(thumb => thumb.classList.remove('active'));
                event.target.classList.add('active');
            });
            gallery.appendChild(img);
        });
    } else {
        if(gallery) gallery.remove();
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

    view.getElementById('product-description').textContent = product.description || 'No hay descripción disponible.';

    const stockElement = view.getElementById('product-stock');
    const whatsappLink = view.getElementById('whatsapp-link');
    const stock = product.stock || 0;
    if (stock > 0) {
        stockElement.textContent = stock > 10 ? '✅ En Stock' : `⚠️ ¡Últimas ${stock} unidades!`;
        stockElement.className = stock > 10 ? 'mt-2 text-sm font-semibold text-green-600' : 'mt-2 text-sm font-semibold text-yellow-600';
    } else {
        stockElement.textContent = '❌ Agotado';
        stockElement.className = 'mt-2 text-sm font-semibold text-red-600';
        whatsappLink.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed', 'pointer-events-none');
        whatsappLink.setAttribute('disabled', true);
    }
    
    const phoneNumber = '51938256218';
    const textMessage = `Hola, estoy interesado en el producto *${product.name}* (COD: ${product.code || 'N/A'}).\n\nEste es el enlace para más detalles:`;
    const baseUrl = window.location.origin + window.location.pathname;
    const productPageURLWithCacheBuster = `${baseUrl}?v=${Date.now()}`;
    const fullMessage = `${textMessage}\n${productPageURLWithCacheBuster}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    whatsappLink.href = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    productContent.innerHTML = '';
    productContent.appendChild(view);
}

main();