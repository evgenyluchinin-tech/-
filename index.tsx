/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Content } from "@google/genai";

interface ProductVariant {
    thickness: string[];
    colors: string[];
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrls: string[];
    category: string;
    variants?: ProductVariant;
}

interface CartItem extends Omit<Product, 'imageUrls'> {
    imageUrl: string; // Cart item will only show the first image
    quantity: number;
    variant?: {
        thickness: string;
        color: string;
    };
    cartItemId: string; // Unique ID for the cart entry, e.g., "12-2.1-red"
}

const products: Product[] = [
    {
        id: 12,
        name: 'DIGNICS 05',
        description: 'Легендарная накладка от Butterfly. Сочетание технологии Spring Sponge X и новой верхней губки обеспечивает невероятное вращение и мощь.',
        price: 6000,
        imageUrls: [
            'https://www.ttshop.ru/image/cache/catalog/productsImages/28516_LRG-946x1000.jpg'
        ],
        category: 'Накладки',
        variants: {
            thickness: ['1.9', '2.1'],
            colors: ['красный', 'черный']
        }
    },
    {
        id: 14,
        name: 'DIGNICS 05 (Special)',
        description: 'Специальная версия легендарной накладки от Butterfly. То же непревзойденное качество с уникальным дизайном упаковки.',
        price: 6050,
        imageUrls: [
            'https://www.ttshop.ru/image/cache/catalog/productsImages/28516_LRG-946x1000.jpg'
        ],
        category: 'Накладки',
        variants: {
            thickness: ['1.9', '2.1'],
            colors: ['красный', 'черный']
        }
    },
    {
        id: 13,
        name: 'DIGNICS 09C',
        description: 'Новейшая разработка с липкой поверхностью. Максимальное сцепление и мощь для атакующих игроков.',
        price: 6200,
        imageUrls: [
            'https://www.ttshop.ru/image/cache/catalog/productsImages/30129_LRG-965x1000.jpg'
        ],
        category: 'Накладки',
        variants: {
            thickness: ['1.9', '2.1'],
            colors: ['красный', 'черный']
        }
    },
    {
        id: 15,
        name: 'Butterfly TENERGY 05',
        description: 'Всемирно известная накладка, совершившая революцию в настольном теннисе. Технология Spring Sponge обеспечивает уникальное чувство мяча и взрывную мощь.',
        price: 5500,
        imageUrls: [
            'https://www.ttshop.ru/image/cache/catalog/productsImages/565_LRG-946x1000.jpg'
        ],
        category: 'Накладки',
        variants: {
            thickness: ['1.9', '2.1'],
            colors: ['красный', 'черный']
        }
    },
    {
        id: 4,
        name: 'Стол "Olympus"',
        description: 'Профессиональный складной стол для настольного тенниса. Превосходный отскок мяча.',
        price: 45000,
        imageUrls: ['https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=2070&auto=format&fit=crop'],
        category: 'Столы'
    },
     {
        id: 5,
        name: 'Кроссовки "Vector"',
        description: 'Специализированная обувь для настольного тенниса. Легкость и превосходное сцепление.',
        price: 8900,
        imageUrls: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop'],
        category: 'Обувь'
    },
    {
        id: 6,
        name: 'Чехол для ракетки "Guardian"',
        description: 'Прочный и стильный чехол для защиты вашей ракетки от повреждений и пыли.',
        price: 1500,
        imageUrls: ['https://plus.unsplash.com/premium_photo-1677248187834-f6551b3279c6?q=80&w=2070&auto=format&fit=crop'],
        category: 'Аксессуары'
    }
];

let cart: CartItem[] = [];
let currentCategory = 'Все';

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const cartCountElement = document.getElementById('cart-count');
    const categoryFiltersContainer = document.getElementById('category-filters');
    
    // Cart elements
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartCheckoutBtn = cartSidebar?.querySelector('.checkout-btn');
    
    // Hero button
    const heroCtaBtn = document.querySelector('.hero .cta-btn');

    // Lightbox elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image') as HTMLImageElement;
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxOverlay = document.querySelector('.lightbox-overlay');

    // Checkout modal elements
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const checkoutOverlay = checkoutModal?.querySelector('.checkout-overlay');
    const checkoutForm = document.getElementById('checkout-form') as HTMLFormElement;
    const checkoutOrderSummaryItems = document.getElementById('checkout-order-summary-items');
    const checkoutTotalPrice = document.getElementById('checkout-total-price');
    const checkoutContent = checkoutModal?.querySelector('.checkout-content');
    let originalCheckoutContentHTML = checkoutContent?.innerHTML;

    // AI Chat elements
    const aiModal = document.getElementById('ai-modal');
    const aiAssistantBtn = document.getElementById('ai-assistant-btn');
    const aiModalCloseBtn = document.getElementById('ai-modal-close-btn');
    const aiModalOverlay = aiModal?.querySelector('.ai-modal-overlay');
    const aiChatMessages = document.getElementById('ai-chat-messages');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input') as HTMLInputElement;

    let currentLightboxImages: string[] = [];
    let currentLightboxIndex = 0;


    if (!productGrid || !cartCountElement || !categoryFiltersContainer || !cartSidebar || !cartItemsContainer || !closeCartBtn || !cartTotalPriceElement || !cartIcon || !cartOverlay) {
        console.error('Required elements not found in the DOM');
        return;
    }
    
    // --- AI Chat Logic ---
    let ai: GoogleGenAI | null = null;
    let chatHistory: Content[] = [];

    const getSystemInstruction = () => {
        const productCatalog = products.map(p => {
            const { imageUrls, ...rest } = p;
            return rest;
        });

        return `Вы — дружелюбный AI-консультант по имени ТТшка в интернет-магазине товаров для настольного тенниса "ТТЕННИС МАРКЕТ".
Ваша задача — помогать покупателям.
Отвечайте вежливо, уважительно и всегда на русском языке.
Ваши ответы должны быть очень краткими и по существу, в 1-2 предложения.
Приоритетно используйте информацию из предоставленного каталога товаров. 
Для общих вопросов или если информации в каталоге нет, используйте поиск в интернете, чтобы дать точный и актуальный ответ.
Всегда предоставляйте источники, если использовали поиск.

Вот текущий каталог товаров:
${JSON.stringify(productCatalog, null, 2)}`;
    };

    const initializeAi = () => {
        if (ai) return;
        try {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        } catch (error) {
            console.error("AI initialization failed:", error);
            addMessageToChat('ai', 'К сожалению, консультант временно недоступен. Попробуйте позже.');
        }
    };

    const addMessageToChat = (sender: 'user' | 'ai' | 'loading', text?: string) => {
        if (!aiChatMessages) return;

        const existingLoader = aiChatMessages.querySelector('.loading');
        if (existingLoader) existingLoader.remove();

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        
        if (sender === 'loading') {
            messageElement.innerHTML = `<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>`;
        } else {
             const textElement = document.createElement('p');
             textElement.textContent = text || '';
             messageElement.appendChild(textElement);
        }

        aiChatMessages.appendChild(messageElement);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    };

    const handleAiChatSubmit = async (event: Event) => {
        event.preventDefault();
        if (!aiChatInput.value.trim() || !ai) return;

        const userMessage = aiChatInput.value.trim();
        addMessageToChat('user', userMessage);
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }]});
        aiChatInput.value = '';
        addMessageToChat('loading');

        try {
            // FIX: `systemInstruction` must be inside the `config` object.
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: chatHistory,
                config: {
                    tools: [{googleSearch: {}}],
                    systemInstruction: getSystemInstruction()
                },
            });

            const aiText = response.text;
            addMessageToChat('ai', aiText);
            chatHistory.push({ role: 'model', parts: [{ text: aiText }]});

        } catch (error) {
            console.error('AI response error:', error);
            addMessageToChat('ai', 'Произошла ошибка. Пожалуйста, попробуйте еще раз.');
        }
    };

    const openAiModal = () => {
        if (!aiModal) return;
        aiModal.hidden = false;
        document.body.classList.add('body-no-scroll');
        aiChatInput.focus();

        initializeAi();

        if (aiChatMessages) aiChatMessages.innerHTML = '';
        const greeting = 'Здравствуйте! Я ТТшка, ваш AI-консультант. Чем могу помочь?';
        addMessageToChat('ai', greeting);
        chatHistory = [{ role: 'model', parts: [{ text: greeting }]}];
    };

    const closeAiModal = () => {
        if (!aiModal) return;
        aiModal.hidden = true;
        document.body.classList.remove('body-no-scroll');
    };

    aiAssistantBtn?.addEventListener('click', openAiModal);
    aiModalCloseBtn?.addEventListener('click', closeAiModal);
    aiModalOverlay?.addEventListener('click', closeAiModal);
    aiChatForm?.addEventListener('submit', handleAiChatSubmit);

    // Lightbox Logic
    const showLightboxImage = (index: number) => {
        if (!currentLightboxImages || currentLightboxImages.length === 0 || !lightboxImage || !lightboxCounter) return;
        currentLightboxIndex = index;
        lightboxImage.src = currentLightboxImages[index];
        lightboxCounter.textContent = `${index + 1} / ${currentLightboxImages.length}`;
    };

    const navigateLightbox = (direction: 'next' | 'prev') => {
        const totalImages = currentLightboxImages.length;
        if (totalImages <= 1) return;

        let newIndex = currentLightboxIndex;
        if (direction === 'next') {
            newIndex = (currentLightboxIndex + 1) % totalImages;
        } else { // prev
            newIndex = (currentLightboxIndex - 1 + totalImages) % totalImages;
        }
        showLightboxImage(newIndex);
    };
    
    const handleLightboxKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowRight') {
            navigateLightbox('next');
        } else if (event.key === 'ArrowLeft') {
            navigateLightbox('prev');
        }
    };

    const openLightbox = (images: string[], startIndex: number) => {
        if(!lightboxModal) return;
        currentLightboxImages = images;
        showLightboxImage(startIndex);
        lightboxModal.hidden = false;
        document.body.classList.add('body-no-scroll');
        document.addEventListener('keydown', handleLightboxKeyDown);
        (lightboxClose as HTMLElement)?.focus();
    };

    const closeLightbox = () => {
        if(!lightboxModal) return;
        lightboxModal.hidden = true;
        document.body.classList.remove('body-no-scroll');
        document.removeEventListener('keydown', handleLightboxKeyDown);
    };


    const openCart = () => {
        cartSidebar.hidden = false;
        document.body.classList.add('body-no-scroll');
        setTimeout(() => closeCartBtn?.focus(), 100); // For accessibility
    }

    const closeCart = () => {
        cartSidebar.hidden = true;
        document.body.classList.remove('body-no-scroll');
    }

    const updateCartDisplay = () => {
        // 1. Update cart items list in the sidebar
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-cart-message">Ваша корзина пуста.</p>`;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-cart-item-id="${item.cartItemId}">
                    <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-price">${item.price.toLocaleString('ru-RU')} ₽</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease-quantity" aria-label="Уменьшить количество">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="quantity-btn increase-quantity" aria-label="Увеличить количество">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" aria-label="Удалить товар">&times;</button>
                </div>
            `).join('');
        }

        // 2. Update total price
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        cartTotalPriceElement.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;
        
        // 3. Update cart icon count
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems.toString();

        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';

        if (totalItems > 0 && !cartCountElement.classList.contains('pulse')) {
            cartCountElement.classList.add('pulse');
            cartCountElement.addEventListener('animationend', () => {
                cartCountElement.classList.remove('pulse');
            }, { once: true });
        }
    }

    const addToCart = (productId: number, options?: { thickness: string; color: string }) => {
        const productToAdd = products.find(p => p.id === productId);
        if (!productToAdd) return;
    
        let cartItemId = productToAdd.id.toString();
        let nameWithVariant = productToAdd.name;
    
        if (options) {
            cartItemId = `${productId}-${options.thickness}-${options.color}`;
            nameWithVariant = `${productToAdd.name} (${options.thickness}мм, ${options.color})`;
        }
    
        const existingItem = cart.find(item => item.cartItemId === cartItemId);
    
        if (existingItem) {
            existingItem.quantity++;
        } else {
            const { imageUrls, ...restOfProduct } = productToAdd;
            const newItem: CartItem = {
                ...restOfProduct,
                imageUrl: imageUrls[0], // Use the first image for the cart
                quantity: 1,
                cartItemId: cartItemId,
                name: nameWithVariant, // Use the name with variant info
                variant: options,
            };
            cart.push(newItem);
        }
        updateCartDisplay();
        openCart();
    };

    const handleCartQuantityChange = (cartItemId: string, change: 'increase' | 'decrease') => {
        const itemInCart = cart.find(item => item.cartItemId === cartItemId);
        if (!itemInCart) return;

        if (change === 'increase') {
            itemInCart.quantity++;
        } else if (change === 'decrease') {
            itemInCart.quantity--;
            if (itemInCart.quantity <= 0) {
                cart = cart.filter(item => item.cartItemId !== cartItemId);
            }
        }
        updateCartDisplay();
    };

    const removeFromCart = (cartItemId: string) => {
        cart = cart.filter(item => item.cartItemId !== cartItemId);
        updateCartDisplay();
    }

    // Checkout Logic
    const openCheckoutModal = () => {
        if (!checkoutModal || !checkoutOrderSummaryItems || !checkoutTotalPrice) return;
        if (cart.length === 0) return;

        closeCart();

        // Populate order summary
        checkoutOrderSummaryItems.innerHTML = cart.map(item => `
            <div class="summary-item">
                <span class="summary-item-name">${item.name} (x${item.quantity})</span>
                <span class="summary-item-price">${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
            </div>
        `).join('');

        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        checkoutTotalPrice.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;

        checkoutModal.hidden = false;
        document.body.classList.add('body-no-scroll');
        (checkoutModal.querySelector('input') as HTMLElement)?.focus();
    };
    
    const closeCheckoutModal = () => {
        if (!checkoutModal) return;
        checkoutModal.hidden = true;
        document.body.classList.remove('body-no-scroll');
        
        // Restore original content if it was changed
        if (checkoutContent && originalCheckoutContentHTML) {
             setTimeout(() => {
                checkoutContent.innerHTML = originalCheckoutContentHTML;
                 // Re-bind form submission after restoring content
                document.getElementById('checkout-form')?.addEventListener('submit', handleOrderConfirmation);
            }, 300); // After transition
        }
    };

    const handleOrderConfirmation = (event: Event) => {
        event.preventDefault();
        if (!checkoutForm.checkValidity() || !checkoutContent) {
            // Can add more sophisticated validation feedback here
            checkoutForm.reportValidity();
            return;
        }

        checkoutContent.innerHTML = `
            <div class="order-success-message">
                <h2>СПАСИБО!</h2>
                <p>Ваш заказ успешно оформлен. Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
            </div>
        `;
        
        cart = [];
        updateCartDisplay();

        setTimeout(closeCheckoutModal, 4000);
    };


    const createProductCardHTML = (product: Product): string => {
        const hasGallery = product.imageUrls.length > 1;
        const imageSliderHtml = `
            <div class="product-image-container ${hasGallery ? 'has-gallery' : ''}">
                ${product.imageUrls.map((url, index) => `
                    <img src="${url}" alt="${product.name} - изображение ${index + 1}" class="product-image ${index === 0 ? 'active' : ''}">
                `).join('')}
                ${hasGallery ? `
                    <button class="slider-btn prev" aria-label="Предыдущее изображение">&lt;</button>
                    <button class="slider-btn next" aria-label="Следующее изображение">&gt;</button>
                    <div class="slider-dots">
                        ${product.imageUrls.map((_, index) => `<span class="dot ${index === 0 ? 'active' : ''}" data-slide-index="${index}"></span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return `
        <article class="product-card" data-product-id="${product.id}">
            ${imageSliderHtml}
            <div class="product-info">
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                </div>
                ${product.variants ? `
                    <div class="product-variants">
                        <div class="variant-group">
                            <span class="variant-label">Толщина:</span>
                            <div class="variant-options">
                                ${product.variants.thickness.map((th, index) => `
                                    <input type="radio" id="thickness-${product.id}-${th}" name="thickness-${product.id}" value="${th}" ${index === 0 ? 'checked' : ''}>
                                    <label for="thickness-${product.id}-${th}">${th} мм</label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="variant-group">
                            <span class="variant-label">Цвет:</span>
                            <div class="variant-options">
                                ${product.variants.colors.map((color, index) => `
                                    <input type="radio" id="color-${product.id}-${color}" name="color-${product.id}" value="${color}" ${index === 0 ? 'checked' : ''}>
                                    <label for="color-${product.id}-${color}" class="color-label ${color === 'красный' ? 'color-red' : 'color-black'}">${color}</label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                <div class="product-footer">
                     <div class="product-price">${product.price.toLocaleString('ru-RU')} ₽</div>
                    <button class="add-to-cart-btn">Добавить в корзину</button>
                </div>
            </div>
        </article>
        `;
    };
    
    const renderCatalog = () => {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear existing content
    
        const productCategories = [...new Set(products.map(p => p.category))];
    
        if (products.length === 0) {
            productGrid.innerHTML = `<p class="no-products">В каталоге пока нет товаров.</p>`;
            return;
        }
        
        productCategories.forEach(category => {
            const productsInCategory = products.filter(p => p.category === category);
            if (productsInCategory.length === 0) return;
    
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.id = `category-${category.replace(/\s+/g, '-')}`;
    
            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);
    
            const categoryProductGrid = document.createElement('div');
            categoryProductGrid.className = 'category-product-grid';
            categoryProductGrid.innerHTML = productsInCategory.map(createProductCardHTML).join('');
            
            categorySection.appendChild(categoryProductGrid);
            productGrid.appendChild(categorySection);
        });
    };
    

    const renderCategoryButtons = () => {
        const categories = ['Все', ...Array.from(new Set(products.map(p => p.category)))];
        categoryFiltersContainer.innerHTML = categories.map(cat => `
            <button class="filter-btn ${cat === currentCategory ? 'active' : ''}" data-category="${cat}" role="tab" aria-selected="${cat === currentCategory}">${cat}</button>
        `).join('');
    };

    const setupCatalogDropdown = () => {
        const dropdownContainer = document.querySelector('.nav-item-dropdown');
        const catalogNavLink = document.getElementById('catalog-nav-link');
        const dropdownMenu = document.getElementById('catalog-dropdown') as HTMLUListElement;

        if (!dropdownContainer || !catalogNavLink || !dropdownMenu) return;

        // 1. Populate dropdown
        const categories = [...new Set(products.map(p => p.category))];
        dropdownMenu.innerHTML = categories.map(cat => {
            const categoryId = `category-${cat.replace(/\s+/g, '-')}`;
            return `<li><a class="dropdown-item" href="#${categoryId}">${cat}</a></li>`;
        }).join('');

        // 2. Toggle on click
        catalogNavLink.addEventListener('click', (e) => {
            e.preventDefault(); // Stop it from scrolling to #product-grid
            dropdownMenu.hidden = !dropdownMenu.hidden;
        });

        // 3. Smooth scroll from dropdown links and close menu
        dropdownMenu.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('dropdown-item')) {
                e.preventDefault();
                const href = target.getAttribute('href');
                if (href) {
                    const elementToScrollTo = document.querySelector(href);
                    elementToScrollTo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                dropdownMenu.hidden = true;
            }
        });

        // 4. Close dropdown if clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target as Node)) {
                dropdownMenu.hidden = true;
            }
        });
    };
    
    // Event Listeners
    heroCtaBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = (event.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (targetId) {
            const targetElement = document.querySelector(targetId);
            targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    productGrid.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        // Add to cart logic
        if (target.classList.contains('add-to-cart-btn')) {
            const productCard = target.closest('.product-card') as HTMLElement;
            const productId = Number(productCard.dataset.productId);
            if (!productId) return;
    
            const product = products.find(p => p.id === productId);
            if (product?.variants) {
                const selectedThickness = (productCard.querySelector(`input[name="thickness-${productId}"]:checked`) as HTMLInputElement)?.value;
                const selectedColor = (productCard.querySelector(`input[name="color-${productId}"]:checked`) as HTMLInputElement)?.value;
                
                if (selectedThickness && selectedColor) {
                    addToCart(productId, { thickness: selectedThickness, color: selectedColor });
                } else {
                    console.error("Пожалуйста, выберите опции товара");
                }
            } else {
                addToCart(productId);
            }
            return;
        }

        const imageContainer = target.closest('.product-image-container');
        if (!imageContainer) return;

        const isSliderBtn = target.classList.contains('slider-btn');
        const isDot = target.classList.contains('dot');
        const isImage = target.classList.contains('product-image');

        if (isSliderBtn || isDot) {
            const images = imageContainer.querySelectorAll('.product-image');
            const dots = imageContainer.querySelectorAll('.dot');
            let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

            if (isSliderBtn) {
                if (target.classList.contains('next')) {
                    currentIndex++;
                    if (currentIndex >= images.length) currentIndex = 0;
                } else { // prev
                    currentIndex--;
                    if (currentIndex < 0) currentIndex = images.length - 1;
                }
            } else if (isDot) {
                currentIndex = parseInt(target.dataset.slideIndex || '0', 10);
            }

            images.forEach((img, index) => img.classList.toggle('active', index === currentIndex));
            dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
        } else if (isImage && imageContainer.classList.contains('has-gallery')) {
            const productCard = target.closest('.product-card') as HTMLElement;
            const productId = Number(productCard.dataset.productId);
            const product = products.find(p => p.id === productId);
            if (product && product.imageUrls.length > 1) {
                const imagesInSlider = Array.from(imageContainer.querySelectorAll('.product-image'));
                const activeImage = imageContainer.querySelector('.product-image.active') as HTMLImageElement;
                const startIndex = imagesInSlider.indexOf(activeImage);
                openLightbox(product.imageUrls, startIndex >= 0 ? startIndex : 0);
            }
        }
    });

    categoryFiltersContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('filter-btn')) {
            const category = target.dataset.category;
            if (category) {
                currentCategory = category;
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    const btnEl = btn as HTMLButtonElement;
                    const isSelected = btnEl.dataset.category === currentCategory;
                    btnEl.classList.toggle('active', isSelected);
                    btnEl.setAttribute('aria-selected', String(isSelected));
                });
                
                const targetId = category === 'Все' ? 'filters-heading' : `category-${category.replace(/\s+/g, '-')}`;
                const elementToScrollTo = document.getElementById(targetId);
                elementToScrollTo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const cartItemElement = target.closest('.cart-item') as HTMLElement;
        if (!cartItemElement) return;

        const cartItemId = cartItemElement.dataset.cartItemId;
        if (!cartItemId) return;

        if (target.classList.contains('increase-quantity')) {
            handleCartQuantityChange(cartItemId, 'increase');
        } else if (target.classList.contains('decrease-quantity')) {
            handleCartQuantityChange(cartItemId, 'decrease');
        } else if (target.classList.contains('remove-item-btn')) {
            removeFromCart(cartItemId);
        }
    });

    const handleCartIconKeyPress = (event: KeyboardEvent) => {
        if(event.key === 'Enter' || event.key === ' ') {
            openCart();
        }
    }

    cartIcon.addEventListener('click', openCart);
    cartIcon.addEventListener('keydown', handleCartIconKeyPress);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    // Checkout Listeners
    cartCheckoutBtn?.addEventListener('click', openCheckoutModal);
    closeCheckoutBtn?.addEventListener('click', closeCheckoutModal);
    checkoutOverlay?.addEventListener('click', closeCheckoutModal);
    checkoutForm?.addEventListener('submit', handleOrderConfirmation);

    // Lightbox event listeners
    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxOverlay?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => navigateLightbox('prev'));
    lightboxNext?.addEventListener('click', () => navigateLightbox('next'));
    
    // Initial render
    setupCatalogDropdown();
    renderCategoryButtons();
    renderCatalog();
    updateCartDisplay();
});