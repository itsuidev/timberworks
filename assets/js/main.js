// GLOBAL VARIABLES
const BASE_URL = "assets/data/";
const KEYS = { CART: "cart", REVIEWS: "reviews", FILTERS: "savedFilters" };
const PAGINATION = { initial: 6, step: 3 };
let allProducts = [];
let allCategories = [];

// AJAX CALLBACK
const fetchData = async (filename, label = filename) => {
    try {
        const data = await $.ajax({
            url: BASE_URL + filename,
            method: "GET",
            dataType: "json"
        });
        if (!data) throw new Error("Empty response");
        return data;
    } catch (err) {
        console.error(`Failed to fetch ${label}:`, err);
        showUserDialog(`Failed to fetch ${label}.`, "error");
        return null;
    }
};

// PAGE LOAD
$(document).ready(async function () {
    window.scrollTo(0, 0);
    Cart.initialize();
    const page = $("body").data("page");

    try {
        const [navigationData, footerData] = await Promise.all([
            fetchData("navigation.json"),
            fetchData("footer.json")
        ]);
        runUniversalPageCode(navigationData, footerData);

        if (page === "index") {
            runIndexPageCode();
        } 
        
        else if (page === "products") {
            const [categoryData, productData] = await Promise.all([
                fetchData("categories.json"),
                fetchData("products.json")
            ]);

            if (!Array.isArray(categoryData) || !Array.isArray(productData)) {
                showUserDialog("Products or categories failed to load.", "error");
                return;
            }

            allCategories = categoryData;
            allProducts = productData;

            let loadedFilters = LocalStorage.get(KEYS.FILTERS);
            if (!loadedFilters) {
                loadedFilters = { category: "all", stock: "in", price: 4000, sort: "default" };
                LocalStorage.set(KEYS.FILTERS, loadedFilters);
            }

            runProductsPageCode(loadedFilters);
        } 
        
        else if (page === "checkout") {
            runCheckoutPageCode();
        } 
        
        else if (page === "contact") {
            const categoryData = await fetchData("categories.json")
            runContactPageCode(categoryData);
        }

    } catch (error) {
        showUserDialog(`${error}`, "error");
    }
    finally {
        const pageOverlay = $("#overlay");
        if ($(pageOverlay).length) {
            $(pageOverlay).addClass("fade-out");
            setTimeout(() => $(pageOverlay).remove(), 1600);
        }
    }
});

// USER DIALOG - SHOWS MESSAGES TO USER
const showUserDialog = (msg, type = "info") => {
    const types = { 
        error: "bg-danger", 
        warn: "bg-warning", 
        info: "color-foreground-primary" 
    };

    const existingAlerts = $("#error-holder .alert");
    if ($(existingAlerts).length >= 3) {
        $(existingAlerts).first().remove(); 
    }

    const html = `
        <div class="alert ${types[type]} text-white border-0 shadow-sm fade show d-flex align-items-center justify-content-between" style="width: 350px;">
            <div><strong>[${type.toUpperCase()}]</strong> <span class="ms-1">${msg}</span></div>
            <button type="button" class="btn-close btn-close-white ms-3" data-bs-dismiss="alert"></button>
        </div>`;

    const $alert = $(html).appendTo("#error-holder");
    setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 4000);
};

// LOCAL STORAGE
const LocalStorage = {
    get: (key, fallback = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (err) {
            console.error(`Failed to load ${key}`, err);
            showUserDialog(`Error loading ${key}`, "error");
            return fallback;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.error(`Failed to save ${key}`, err);
            showUserDialog(`Error saving ${key}`, "error");
        }
    },
    remove: (key) => localStorage.removeItem(key)
};

// CART FUNCTIONALITY
const Cart = {
    items: [],
    initialize: () => Cart.items = LocalStorage.get(KEYS.CART, []),
    sync: () => LocalStorage.set(KEYS.CART, Cart.items),
    exists: (id) => Cart.items.some(i => i.id == id),
    add: (product) => {
        if (Cart.exists(product.id)) return showUserDialog("Item is already in cart.", "warn");
        Cart.items.push({
            id: product.id,
            name: product.name,
            price: { ...product.price },
            image: product.img.src,
            imageAlt: product.img.alt
        });
        Cart.sync();
        showUserDialog("Item added to cart.", "info");
    },
    remove: (id) => {
        Cart.items = Cart.items.filter(i => i.id != id);
        Cart.sync();
    },
    getTotal: () => {
        return Cart.items.reduce((sum, item) => sum + PriceService.discountPrice(item.price), 0);
    }
};
    
const nameRegex = /^[A-ZČĆŠĐŽ][a-zčćšđž]+(?:\s[A-ZČĆŠĐŽ][a-zčćšđž]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DataValidation = {
    validationRules: {
        firstName: { regex: nameRegex, name: "First name" },
        lastName: { regex: nameRegex, name: "Last name" },
        email: { regex: emailRegex, name: "Email" },
        message: { min: 20, name: "Message" },
        question: { name: "Question type" },
        consent: { name: "I agree to be contacted about the offer" },
        reviewName: { regex: nameRegex, name: "Review name" },
        reviewText: { min: 10, name: "Review text" }
    },
    toggleError: (id, errorType = null, minLen = 0) => {
        const element = $(`#${id}`);
        const label = $(`#${id}Label`);
        const fieldName = DataValidation.validationRules[id]?.name || "Field";

        if (!errorType) {
            $(element).removeClass("is-invalid");
            label.html(fieldName);
            return true;
        }

        const messages = {
            empty: "* Can't be empty!",
            regex: "* Wrong format!",
            min: `* Minimum ${minLen} characters!`,
            radio: "* Please select one!",
            checkbox: "* Required! "
        };

        $(element).addClass("is-invalid");
        label.html(`${fieldName} <span class="text-danger small">${messages[errorType]}</span>`);
        return false;
    },
    validateField: (id) => {
        const element = $(`#${id}`);
        const value = element.val()?.trim();
        const rule = DataValidation.validationRules[id];

        if (value === "") return DataValidation.toggleError(id, "empty");
        if (rule.regex && !rule.regex.test(value)) return DataValidation.toggleError(id, "regex");
        if (rule.min && value.length < rule.min) return DataValidation.toggleError(id, "min", rule.min);

        return DataValidation.toggleError(id);
    }
};

const Render = {
    categoryDropdown: (element, categoryData) => {
        if(!categoryData) {
            showUserDialog("No categories loaded.", "error");
            return;
        }
        let html = `<option value="all">Choose table category:</option>`;
        for (let category of categoryData) {
            html += `<option value="${category.name}">${category.name}</option>`;
        }
        $(`${element}`).html(html);
    }
};

const PriceService = {
    regularPrice: (price) => price.regular || 0,
    discountPrice: (price) => price.regular * (1 - (price.discount || 0) / 100),
    format: (amount) => `$${amount.toFixed(2)}`
};

// UNIVERSAL CODE THAT ALL PAGES USE
const runUniversalPageCode = (navigationData, footerData) => {

    // DYNAMIC NAVIGATION
    const createNavigation = (navigationData) => {
        if (!navigationData) {
            showUserDialog("No navigation loaded.", "error");
            return;
        }
        let listItemsHTML = "";

        for (let item of navigationData) {
            let isActive = "";
            const path = window.location.pathname;

            if (path.endsWith(item.href)) isActive = "active";

            if (item.image) {
                listItemsHTML += `
                <li class="nav-item">
                    <a class="navbar-brand m-0" href="${item.href}">
                        <img src="${item.image.src}" alt="${item.image.alt}" class="img-fluid nav-logo custom-transition"/>
                    </a>
                </li>`;
                } else {
                    const downloadable = item.downloadable ? "download" : "";
                    listItemsHTML += `
                <li class="nav-item">
                    <a class="nav-link custom-transition ${isActive}" href="${item.href}" ${downloadable}>
                        ${item.text.toUpperCase()}
                    </a>
                </li>`;
            }
        }

        const html = `
        <div class="container-fluid">
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mx-auto d-flex align-items-center fs-6 gap-5">
                    ${listItemsHTML}
                </ul>
            </div>
        </div>`;

        $("#main-nav").html(html);
    };

    // DYNAMIC FOOTER
   const createFooter = (footerData) => {
        if (!footerData) {
            showUserDialog("No footer loaded.", "error");
            return;
        }

        const buildList = (items, callback) => {
            let html = "";
            for (const item of items) {
                html += callback(item);
            }
            return html;
        };

        const buildColumn = (title, contentHTML, isContact = false) => {
            const lineClass = isContact ? "color-foreground-light" : "color-foreground-secondary";
            return `
                <div class="col-lg-3 col-md-6 footer-column p-3 ${isContact ? "footer-contact" : ""}">
                    <h4 class="fs-4 ${isContact ? "" : "color-text-secondary"} mb-4">${title}</h4>
                    <div class="footer-line ${lineClass} custom-rounded-small mb-4"></div>
                    <ul class="footer-list p-0 list-unstyled">${contentHTML}</ul>
                </div>
            `;
        };

        const navHTML = buildList(footerData.navigation, (item) => {
            const isActive = window.location.pathname.endsWith(item.href) ? "footer-active" : "";
            return `<li class="mb-3"><a class="color-text-light custom-transition ${isActive}" href="${item.href}">${item.text.toUpperCase()} PAGE</a></li>`;
        });

        const productHTML = buildList(footerData.products, (item) =>
            `<li class="mb-3"><a class="color-text-light custom-transition" href="${item.href}">${item.text}</a></li>`
        );

        const contactItems = [
            { icon: "bi-telephone", text: footerData.contactinfo.phone },
            { icon: "bi-envelope", text: footerData.contactinfo.email },
            { icon: "bi-geo-alt", text: footerData.contactinfo.address }
        ];
        const contactHTML = buildList(contactItems, (item) =>
            `<li class="mb-3"><span class="bi ${item.icon} me-2"></span>${item.text}</li>`
        );

        const socialHTML = buildList(footerData.socials, (item) =>
            `<a href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="${item.type}"><span class="${item.icon}"></span></a>`
        );

         const footerHTML = `
            <footer class="container">
                <div class="row">
                    <div class="col-lg-3 col-md-6 footer-column text-center p-3">
                        <p class="custom-letter-spacing-small fw-bold color-text-primary mb-0 fs-3">TIMBER<span class="color-text-secondary">WORKS</span></p>
                        <p class="custom-letter-spacing-medium mb-5">CARPENTRY</p>
                        <a href="contact.html" class="contact-btn color-text-light custom-border-light custom-rounded-small custom-letter-spacing-small custom-transition custom-button-padding-medium">
                            CONTACT US<span class="bi bi-send ms-2 custom-transition"></span>
                        </a>
                    </div>
                    ${buildColumn("NAVIGATION", navHTML)}
                    ${buildColumn("CONTACT INFO", contactHTML, true)}
                    ${buildColumn("PRODUCTS", productHTML)}
                </div>
                <div class="footer-bottom mt-4 pt-3">
                    <div class="row align-items-center">
                        <div class="col-md-4 mb-3 mb-md-0"><div class="social-icons d-flex gap-3 fs-5">${socialHTML}</div></div>
                        <div class="col-md-4 text-center mb-3 mb-md-0"><p class="custom-letter-spacing-small m-0">&copy;2026 ALL RIGHTS RESERVED</p></div>
                        <div class="col-md-4 text-md-end text-center"><p class="custom-letter-spacing-small m-0">DEVELOPED BY IGOR SUVIĆ</p></div>
                    </div>
                </div>
            </footer>
        `;

        $("#footer-section").html(footerHTML);
    };

    // CREATE FOOTER AND NAVIGATION
    createNavigation(navigationData);
    createFooter(footerData);

    // NAV AND CART SCROLL ANIMATION
    const mainNav = $("#main-nav");
    const floatingCart = $("#floating-cart-container");

    $(window).on("scroll", function () {
        const isScrolled = $(window).scrollTop() > 0;
        $(mainNav).toggleClass("main-nav-alt", isScrolled);
        $(floatingCart).toggleClass("floating-cart-container-alt", isScrolled);
    });
};

// CODE FOR INDEX.HTML (jQuery Version)
const runIndexPageCode = () => {
    const hero = $("#hero-background");
    const arrow = $("#arrow");

    $(window).on("scroll", function () {
        const isScrolled = $(window).scrollTop() > 0;
        $(hero).toggleClass("hero-background-alt", isScrolled);
        $(arrow).toggleClass("arrow-alt", isScrolled);
    });

    $("#about-btn").on("click", function() {
        const aboutAnchor = $("#about-section");
        $("html, body").animate({
            scrollTop: $(aboutAnchor).offset().top
        }, 800);
    });

    $("#featured-btn").on("click", function() {
        const featuredAnchor = $("#featured-anchor");
        $("html, body").animate({
            scrollTop: $(featuredAnchor).offset().top
        }, 800);
    });
};

// CODE FOR PRODUCTS.HTML
const runProductsPageCode = (loadedFilters) => {
    document.querySelectorAll(".detail-item").forEach(item => {
        item.addEventListener("click", () => {
        const wrapper = item.parentElement;
        const content = wrapper.querySelector(".detail-content");

        if (content.classList.contains("open")) {
            return;
        }

        document.querySelectorAll(".detail-content").forEach(panel => {
            panel.classList.remove("open");
            panel.parentElement.querySelector(".detail-item").classList.remove("open-panel");
        });

        content.classList.add("open");
        item.classList.add("open-panel");
        });
    });
    
    let filteredProducts = [];
    // MINI CART
    const updateMiniCart = () => {
        const cart = Cart.items;
        const cartItemList = $("#cart-items-list");
        const cartFooter = $("#cart-footer");
        const cartTotalPrice = $("#cart-total-price");
        const cartCountBadge = $("#cart-count");

        let total = 0;
        let html = "";

        if (cart.length === 0) {
            html = '<p class="text-muted text-center py-3">Cart is empty.</p>';
            cartFooter.hide();
        } else {
            cartFooter.show();
            cart.forEach(item => {
                const itemSubtotal = PriceService.discountPrice(item.price);
                total += itemSubtotal;

                html += `
                    <div class="d-flex align-items-center mb-3 cart-item-mini">
                        <img src='${item.image}' alt='${item.imageAlt}' />
                        <div class="flex-grow-1">
                            <p class="m-0 fw-bold small color-text-dark">${item.name}</p>
                            <p class="m-0 text-muted small">Price: ${PriceService.format(itemSubtotal)}</p>
                        </div>
                        <button class="btn btn-sm text-danger btn-danger remove-mini me-3" data-id="${item.id}">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                `;
            });
        }

        cartItemList.html(html);
        cartTotalPrice.text(`$${total.toFixed(2)}`);
        cartCountBadge.text(cart.length).toggle(cart.length > 0);
    };

    if (!Array.isArray(allProducts) || !Array.isArray(allCategories)) {
        showUserDialog("Data not loaded.", "error");
        return;
    }

    let currentLayout = "grid-3";
    let visibleCount = 6;
    const step = 3;

    Render.categoryDropdown("#productCategoryFilter", allCategories);

    const renderProducts = (productData) => {
        const catalogue = $("#catalogue-content");
        let html = "";

        for (let product of productData) {
            html += `
            <div class="col-12 col-md-6 col-lg-4 mb-4 product-card d-none ${currentLayout}" data-id="${product.id}">
                <div class="card h-100 shadow-sm color-background-primary">
                    ${showImage(product.img)}
                    ${product.stock > 0 ? showDiscount(product.price) : ""}
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title text-uppercase color-text-secondary">${product.name}</h6>
                        ${showProductDescription(product.img)}
                        <div class="mt-auto d-flex justify-content-start align-items-center">
                            ${showStock(product.stock)}
                        </div>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            ${product.stock > 0 ? showPrice(product.price) : ""}
                            ${product.stock > 0 ? showCartButton(product.id) : ""}
                        </div>
                    </div>
                </div>
            </div>`;
        }
        catalogue.html(html);
    };

    const refreshProducts = (filteredProductData) => {
        const catalogue = $("#catalogue-content");

        $(".products-empty").remove();
        if (filteredProductData.length === 0) {
            catalogue.append(`<p class="products-empty w-100 text-center py-5">No products meeting the selected criteria.</p>`);
        }

        $(".product-card").addClass("d-none");
        const productsToShow = filteredProductData.slice(0, visibleCount);

        for(let product of productsToShow) {
            const productElement = $(`.product-card[data-id="${product.id}"]`);
            productElement.removeClass("d-none");
            const btn = productElement.find(".add-to-cart-btn");

            if(Cart.exists(product.id)) {
                btn.text("In cart").addClass("disabled btn-secondary").removeClass("btn-dark");
            }
            else {
                btn.text("Add to cart").addClass("btn-dark").removeClass("disabled btn-secondary");
            }
        }

        ToggleloadMore(filteredProductData.length);
    };

    const showImage = (image) => `<img src="${image.src}" class="card-img-top img-fluid h-100" alt="${image.alt}">`;
    const showProductDescription = (image) => `<p class="card-text text-truncate">${image.alt}</p>`;
    const showStock = (stock) => `<small class="mt-1 color-border-soft">${stock > 0 ? stock + " in stock" : "Out of stock"}</small>`;
    const showPrice = (price) => {
        const hasDiscount = price.discount && price.discount > 0;
        const regularHTML = `<span class="text-decoration-line-through color-text-dim btn-sm ms-2">${PriceService.format(PriceService.regularPrice(price))}</span>`;
        return `<span class="fw-bold btn btn-sm color-foreground-primary pointer-none">${PriceService.format(PriceService.discountPrice(price))} ${hasDiscount ? regularHTML : ""}</span>`;
    };
    const showDiscount = (price) => price.discount ? `<span class="fw-bold btn btn-sm color-foreground-primary discount-tag position-absolute">${price.discount ? `${price.discount}% OFF` : ""}</span>`: "";
    const showCartButton = (id) => `<button class='add-to-cart-btn btn btn-sm btn-dark' data-id='${id}'>Add to cart</button>`;
    const findCategoryName = (categoryId) => allCategories.find(c => c.id == categoryId)?.name;

    const getFilteredProducts = () => {
        let result = [...allProducts];

        const category = $("#productCategoryFilter").val() || "all";
        const stock = $("#productStockFilter").val() || "in";
        const price = $("#productPriceRange").val() || 4000;
        const sort = $("#productSort").val() || "default";
        const search = $("#productSearch").val()?.trim().toLowerCase() || "";

        if (search !== "") result = result.filter(p => p.name.toLowerCase().includes(search));
        if (category !== "all") result = result.filter(p => findCategoryName(p.categoryId) == category);
        result = result.filter(p => PriceService.discountPrice(p.price) <= price);

        if (stock === "in") result = result.filter(p => p.stock > 0);
        if (stock === "out") result = result.filter(p => p.stock == 0);

        if (sort === "low-price") result.sort((a, b) => PriceService.discountPrice(a.price) - PriceService.discountPrice(b.price));
        if (sort === "high-price") result.sort((a, b) => PriceService.discountPrice(b.price) - PriceService.discountPrice(a.price));
        if (sort === "A-Z") result.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === "Z-A") result.sort((a, b) => b.name.localeCompare(a.name));

        return result;
    }

    const applyFilters = () => {
        filteredProducts = getFilteredProducts();
        
        const savedFilters = {
            category: $("#productCategoryFilter").val() || "all",
            stock: $("#productStockFilter").val() || "in",
            price: $("#productPriceRange").val() || 4000,
            sort: $("#productSort").val() || "default"
        };

        LocalStorage.set(KEYS.FILTERS, savedFilters);

        visibleCount = 6;
        refreshProducts(filteredProducts);
    };

    const loadMore = () => {
        visibleCount += step;
        refreshProducts(filteredProducts);
    };

    const ToggleloadMore = (total) => $("#loadMoreBtn").toggle(visibleCount < total);

    $(document).on("change", "#productCategoryFilter", applyFilters);
    $(document).on("change", "#productStockFilter", applyFilters);
    $(document).on("input", "#productSearch", applyFilters);

    let productPriceRangeValue = $("#productPriceRangeValue");
    $(document).on("input", "#productPriceRange", function () {
        $(productPriceRangeValue).text($(this).val());
        applyFilters();
    });

    $(document).on("change", "#productSort", applyFilters);
    $(document).on("click", "#loadMoreBtn", loadMore);
    $(document).on("click", ".add-to-cart-btn", function() {
        let id = parseInt($(this).data('id'));
        let product = allProducts.find(pr => pr.id == id);
        if(product) Cart.add(product);
        else showUserDialog(`Product with ID: ${id} hasn't been found in the database.`, "error");
        applyFilters();
        updateMiniCart();
    });

    $(document).on("click", ".remove-mini", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        Cart.remove(id);
        updateMiniCart();
        showUserDialog("Item removed from cart.", "info");
        if(typeof refreshProducts === "function") applyFilters(); 
    });

    renderProducts(allProducts);
    updateMiniCart();

    if (loadedFilters) {
        if (loadedFilters.category) $("#productCategoryFilter").val(loadedFilters.category);
        if (loadedFilters.stock) $("#productStockFilter").val(loadedFilters.stock);
        if (loadedFilters.sort) $("#productSort").val(loadedFilters.sort);
        
        if (loadedFilters.price) {
            $("#productPriceRange").val(loadedFilters.price);
            $("#productPriceRangeValue").text(loadedFilters.price);
        }
    }

    applyFilters();

};

// CODE FOR CONTACT.HTML
const runContactPageCode = (categoryData) => {
    Render.categoryDropdown("#tableType", categoryData);

    $("input[data-validate], textarea[data-validate]").on("input", function () {
        DataValidation.validateField(this.id);
    });

    $('input[name="question"]').on("change", () => DataValidation.toggleError("question"));

    $('input[name="consent"]').on("change", () => DataValidation.toggleError("consent"));

    $("#contact-form").on("submit", function (e) {
        let isValid = true;
        const contactFields = ["firstName", "lastName", "email", "message"];

        for (let id of contactFields) {
            if (!DataValidation.validateField(id)) isValid = false;
        }

        if (!$('input[name="question"]:checked').length) {
            DataValidation.toggleError("question", "radio");
            isValid = false;
        }
        if (!$('input[name="consent"]:checked').length) {
            DataValidation.toggleError("consent", "checkbox");
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
            showUserDialog("Please check the highlighted fields.", "error");
        }
    });

    // GOOGLE MAP
    const map = $("#google-map");
    const mapImage = $(".google-map-popup");
    $(map).on("mouseenter", () => {
        $(mapImage).css({
            transform: "translateX(-50%) translateY(0px)",
            opacity: "1"
        });
    });
    $(map).on("mouseleave", () => {
        $(mapImage).css({
            transform: "translateX(-50%) translateY(20px)",
            opacity: "0"
        });
    });

    // REVIEWS
    const reviewNameElement = $("#reviewName");
    const reviewTextElement = $("#reviewText");
    const reviewRatingElement = $("#reviewRating");
    const reviewsContainer = $("#reviews");

    let allReviews = LocalStorage.get(KEYS.REVIEWS) || [];
    let reviewCount = allReviews.length;

    const renderReviews = (reviewsData) => {
        let html = "";

        if (reviewsData.length == 0) {
            html = '<p class="text-center">No reviews to show.</p>';
            $(reviewsContainer).html(html);
            return;
        }

        reviewsData = reviewsData.sort((r1, r2) => new Date(r1.date) - new Date(r2.date));
        for (let review of reviewsData) {
            const stars = `<strong class='color-text-primary'>Rating: <span class='color-text-light'>${"★ ".repeat(review.rating)}</span></strong>`;
            html += `
            <div class="d-flex align-items-start my-4 w-100">
                <div class="me-3 fw-bold d-flex justify-content-center align-items-center rounded mt-1 review-badge" 
                    style="width: 45px; height: 45px; background-color: #C29C6C; flex-shrink: 0; color: white;">
                    ${review.index}
                </div>

                <div> 
                    <p class="m-0"><strong class="color-text-primary">By: </strong>${review.name}</p>
                    <p>${stars}</p>

                    <p class="mb-1 text-break">${review.text}</p>
                    <small class="text-secondary">Post date: ${review.date}</small>
                </div>
            </div>
            `;
        }
        $(reviewsContainer).html(html);
    };

    renderReviews(allReviews);

    $(document).on("click", "#add-review-btn", () => {
        const reviewNameValue = $(reviewNameElement).val().trim();
        const reviewTextValue = $(reviewTextElement).val().trim();
        const reviewRatingValue = $(reviewRatingElement).val();

        let errors = [];
        if (!reviewTextValue || reviewTextValue.length < 10) {
            $(reviewTextElement).addClass("is-invalid");
            errors.push("Review should be at least 10 letters long.");
        } else $(reviewTextElement).removeClass("is-invalid");

        if (!reviewNameValue || reviewNameValue.length < 10) {
            $(reviewNameElement).addClass("is-invalid");
            errors.push("Please enter a name.")
        } else $(reviewNameElement).removeClass("is-invalid");

        if (reviewRatingValue == "0") {
            errors.push("Please select a rating.");
            $(reviewRatingElement).addClass("is-invalid");
        } else $(reviewRatingElement).removeClass("is-invalid");

        if (errors.length > 0) {
            for(let error of errors) {
                showUserDialog(`${error}`, "error");
            }
            return;
        }

        const newReview = {
            index: ++reviewCount,
            name: reviewNameValue,
            text: reviewTextValue,
            rating: reviewRatingValue,
            date: new Date().toDateString()
        };

        allReviews.push(newReview);
        LocalStorage.set(KEYS.REVIEWS, allReviews);
        showUserDialog("Review added!", "info");
        renderReviews(allReviews);

        reviewTextElement.val("");
        reviewRatingElement.val("0");
    });
};

const runCheckoutPageCode = () => {
    function renderCheckout() {
        const cart = Cart.items;
        const cartItemList = $("#checkout-items-list");
        let total = 0;

        cartItemList.empty();

        if (cart.length === 0) {
            cartItemList.append('<li class="list-group-item">Your cart is empty.</li>');
            return;
        }

        cart.forEach(item => {
            const subtotal = PriceService.discountPrice(item.price) * (item.quantity || 1);
            total += subtotal;

            cartItemList.append(`
                <li class="list-group-item d-flex justify-content-between lh-sm py-3 bg-transparent">
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" class="product-img-checkout me-3" alt="${item.name}">
                        <div>
                            <h6 class="my-0 fw-bold color-text-dark">${item.name}</h6>
                            <small class="text-muted">Quantity: ${item.quantity || 1}</small>
                        </div>
                    </div>
                    <span class="text-muted">$${subtotal.toFixed(2)}</span>
                </li>
            `);
        });

        $("#checkout-total-price").text(`$${total.toFixed(2)}`);
        $("#checkout-cart-count").text(cart.length);
    }

    renderCheckout();

    $("#checkout-form").on("submit", function(e) {
        e.preventDefault();
        if (this.checkValidity()) {
            LocalStorage.set(KEYS.CART, []);
            window.location.href = "index.html";
        }
        $(this).addClass('was-validated');
    });
}