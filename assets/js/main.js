window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

// FUNKCIJA ZA GRESKE
const CheckError = (value, message = "Neispravna vrednost.") => {
  try {
    if (!value) throw new Error(message);
    return value;
  } 
  catch (err) {
    console.error("Error:", err.message);
    return null;
  }
}

// AJAX DOHVATANJE PODATAKA
(() => {
  const FILES_TO_LOAD = ["assets/data/navigation.json", "assets/data/footer.json"];
  const LOADED_FILES = [];
  let loadedCount = 0;

  const page = document.body.dataset.page;
  if(page === "products") FILES_TO_LOAD.unshift("assets/data/products.json");

  FILES_TO_LOAD.forEach((file, index) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", file, true);
    xhr.send();

    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4) {
        try {
          if(xhr.status === 200) LOADED_FILES[index] = JSON.parse(xhr.responseText);
          else console.error("Greska u HTTP zahtevu: ", xhr.status);
        } catch(err) {
          console.error("Greska pri parsiranju JSON-a:", err.message);
        } finally {
          loadedCount++;
          if (loadedCount === FILES_TO_LOAD.length) {
            let offset = 0;
            let productData;
            if(page === "products") {
              productData = CheckError(LOADED_FILES[0], "products.json nije učitan ili je nevalidan.");
              offset = 1;
            }
            const navigationData = CheckError(LOADED_FILES[offset], "navigation.json nije učitan ili je nevalidan.");
            const footerData = CheckError(LOADED_FILES[offset + 1], "footer.json nije učitan ili je nevalidan.");
            StartPage(navigationData, footerData, productData);
          }
        }
      }
    };
  });
})();

// KOD ZA POKRETANJE STRANICE
const StartPage = (navigationData, footerData, productData = null) => {
  RunUniversalPageCode(navigationData, footerData);
  const body = CheckError(document.querySelector('body'),"Nije pronadjen body na stranici.");
  if(!body) return;

  const page = CheckError(body.dataset.page, "Nije pronadjen data-page atribut u body.");
  if(!page) return;

  if (page === 'index') RunIndexPageCode();
  else if (page === 'products') RunProductsPageCode(productData);
  else if (page === 'contact') RunContactPageCode();
  else if (page === 'author' || page === 'message') console.log("Stranica nema JS funkcionalnosti.");
  else console.error(`Stranica sa imenom '${page}' ne postoji. Proveriti vrednost data-page atributa.`);
}

// UNIVERZALNI KOD SVAKE STRANICE
const RunUniversalPageCode = (navigationData, footerData) => {
  // DINAMICKA NAVIGACIJA
  const createNavigation = (navData) => {
    const nav = document.createElement('nav');
    nav.id = "main-nav";
    nav.className = "navbar navbar-expand-lg navbar-dark fixed-top mt-5 z-2 custom-transition";

    let navLinksHTML = ''; 

    navData.forEach(item => {
      let isActive = '';
      if (item.href && (window.location.pathname.endsWith(item.href) || 
        (item.href === "index.html" && (window.location.pathname === "/" || window.location.pathname.endsWith("index.html"))))) {
        isActive = 'active';
      }

      if (item.image) {
        navLinksHTML += `
          <li class="nav-item">
            <a class="navbar-brand m-0" href="${item.href}">
              <img src="${item.image.src}" alt="${item.image.alt}" class="img-fluid nav-logo custom-transition"/>
            </a>
          </li>
        `;
      } 
      else {
        const downloadAttr = item.downloadable ? 'download' : '';
        navLinksHTML += `
          <li class="nav-item">
            <a class="nav-link custom-transition ${isActive}" href="${item.href}" ${downloadAttr}>
              ${item.text.toUpperCase()}
            </a>
          </li>
        `;
      }
    });

    nav.innerHTML = `
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav mx-auto d-flex align-items-center fs-6 gap-5">
            ${navLinksHTML}
          </ul>
        </div>
      </div>
    `;

    document.body.prepend(nav);
  };

  // DINAMICKI FOOTER
  const createFooter = (footData) => {
    const footerSection = document.getElementById('footer-section');
    if (!footerSection) return;

    let navLinksHTML = '';
    footData.navigation.forEach(item => {
      const isActive = (window.location.pathname.endsWith(item.href)) ? 'footer-active' : '';
      navLinksHTML += `
        <li class="mb-3">
          <a class="color-text-light custom-transition ${isActive}" href="${item.href}">${item.text.toUpperCase()} PAGE</a>
        </li>
      `;
    });

    let productLinksHTML = '';
    footData.products.forEach(item => {
      productLinksHTML += `
        <li class="mb-3">
          <a class="color-text-light custom-transition" href="${item.href}">${item.text}</a>
        </li>
      `;
    });

    footerSection.innerHTML = `
      <footer class="container">
        <div class="row">
          <div class="col-lg-3 col-md-6 footer-column text-center p-3">
            <p class="custom-letter-spacing-small fw-bold color-text-primary mb-0 fs-3">TIMBER<span class="color-text-secondary">WORKS</span></p>
            <p class="custom-letter-spacing-medium mb-5">CARPENTRY</p>
            <a href="contact.html" class="contact-btn color-text-light custom-border-light custom-rounded-small custom-letter-spacing-small custom-transition custom-button-padding-medium">
              CONTACT US<span class="bi bi-send ms-2 custom-transition"></span>
            </a>
          </div>

          <div class="col-lg-3 col-md-6 footer-column p-3">
            <h4 class="fs-4 color-text-secondary mb-4">NAVIGATION</h4>
            <div class="footer-line color-foreground-secondary custom-rounded-small mb-4"></div>
            <ul class="footer-list p-0 list-unstyled">
              ${navLinksHTML}
            </ul>
          </div>

          <div class="col-lg-3 col-md-6 footer-column footer-contact p-3">
            <h4 class="fs-4 mb-4">CONTACT INFO</h4>
            <div class="footer-line color-foreground-light custom-rounded-small mb-4"></div>
            <ul class="footer-list p-0 list-unstyled">
              <li class="mb-3"><span class="bi bi-telephone me-2"></span>${footData.contactinfo.phone}</li>
              <li class="mb-3"><span class="bi bi-envelope me-2"></span>${footData.contactinfo.email}</li>
              <li class="mb-3"><span class="bi bi-geo-alt me-2"></span>${footData.contactinfo.address}</li>
            </ul>
          </div>

          <div class="col-lg-3 col-md-6 footer-column p-3">
            <h4 class="fs-4 color-text-secondary mb-4">PRODUCTS</h4>
            <div class="footer-line color-foreground-secondary custom-rounded-small mb-4"></div>
            <ul class="footer-list p-0 list-unstyled">
              ${productLinksHTML}
            </ul>
          </div>
        </div>

        <div class="footer-bottom mt-4 pt-3">
          <div class="row align-items-center">
            <div class="col-md-4 mb-3 mb-md-0">
              <div class="social-icons d-flex gap-3 fs-5">
                <a href="https://github.com/itsuidev" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <span class="bi bi-github"></span>
                </a>
                <a href="https://www.youtube.com/channel/UC0Zmf-VfOpLLB4XJoYszJqQ" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <span class="bi bi-youtube"></span>
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <span class="bi bi-instagram"></span>
                </a>
              </div>
            </div>
            <div class="col-md-4 text-center mb-3 mb-md-0">
              <p class="custom-letter-spacing-small m-0">&copy;2026 ALL RIGHTS RESERVED</p>
            </div>
            <div class="col-md-4 text-md-end text-center">
              <p class="custom-letter-spacing-small m-0">DEVELOPED BY IGOR SUVIĆ</p>
            </div>
          </div>
        </div>
      </footer>
    `;
  };

  createNavigation(navigationData);
  createFooter(footerData);

  // FADE UCITAVANJE STRANICE
  const pageOverlay = CheckError(document.getElementById('overlay'), "Overlay stranice ne postoji!");
  if(!pageOverlay) return;
  pageOverlay.classList.add('fade-out');
  setTimeout(() => pageOverlay.remove(), 1600);

  // NAV SCROLL ANIMACIJA
  const mainNav = CheckError(document.getElementById('main-nav'), "Glavna navigacija nije pronadjena!");
  if (!mainNav) return;
  window.addEventListener('scroll', () => {
    mainNav.classList.toggle('main-nav-alt', window.scrollY > 0);
  });

  // DUGME ZA VRH STRANICE
  const buttonTop = CheckError(document.getElementById('top-btn'), "Nije pronadjeno dugme za vracanje na vrh stranice.");
  buttonTop.addEventListener('click', () => {
    window.scrollTo(0, 0);
  });
};

// KOD ZA INDEX.HTML
const RunIndexPageCode = () => {
  const hero = document.getElementById('hero-background');
  const arrow = document.getElementById('arrow');

  if (!hero && !arrow) return;

  window.addEventListener('scroll', () => {
    if (hero) hero.classList.toggle('hero-background-alt', window.scrollY > 0);
    if (arrow) arrow.classList.toggle('arrow-alt', window.scrollY > 0);
  });

  const aboutBtn = document.getElementById('about-btn');
  if (!aboutBtn) return;

  aboutBtn.addEventListener('click', () => {
    const el = document.getElementById('about-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  const featuredBtn = CheckError(document.getElementById('featured-btn'), "Featured dugme ne postoji!");
  if (!featuredBtn) return;
  featuredBtn.addEventListener('click', () => {
    const el = document.getElementById('featured-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
};

// KOD ZA PRODUCTS.HTML
const RunProductsPageCode = (productData) => {
  let currentLayout = "grid-3";
  let visibleCount = 6;
  const step = 3;
  let filteredProducts = [];

  const RenderProducts = (productsArray) => {
    const catalogueContent = CheckError(document.getElementById("catalogue-content"), "Ne postoji div za katalog proizvoda!");
    if(!catalogueContent) return;
    catalogueContent.innerHTML = "";

    const visibleProducts = productsArray.slice(0, visibleCount);

    visibleProducts.forEach(p => {
      const div = document.createElement("div");
      div.className = `col-12 col-md-6 col-lg-4 mb-4 product-card ${currentLayout}`;

      div.innerHTML = `
        <div class="card h-100 shadow-sm color-background-primary">
          <img src="${p.img.src}" class="card-img-top img-fluid h-100" alt="${p.img.alt}">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title text-uppercase color-text-secondary">${p.name}</h6>
            
            <p class="card-text text-truncate">${p.img.alt}</p>
            <small class="mt-1 color-border-soft">${p.stock > 0 ? p.stock + " in stock" : "Out of stock"}</small>

            <div class="mt-auto d-flex justify-content-between align-items-center">
              <span class="text-decoration-line-through color-text-secondary">$${p.price.oldPrice}</span>
              <span class="fw-bold btn btn-sm color-foreground-primary">$${p.price.newPrice}</span>
            </div>
          </div>
        </div>
      `;
      catalogueContent.appendChild(div);
    });

    ToggleLoadMore(productsArray.length);
  };

  const ApplyFilters = () => {
    filteredProducts = [...productData];

    const categoryFilter = document.getElementById("category-filter").value;
    const stockFilter = document.getElementById("stock-filter").value;
    const priceRange = parseFloat(document.getElementById("price-range").value);
    const sortOrder = document.getElementById('price-sort').value;
    console.log(sortOrder);

    if (categoryFilter !== "all")
      filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);

    if (stockFilter !== "all")
      filteredProducts = filteredProducts.filter(p =>
        stockFilter === "in" ? p.stock > 0 : p.stock === 0
      );

    filteredProducts = filteredProducts.filter(p => p.price.newPrice <= priceRange);
    
    if (sortOrder === "low-price") filteredProducts.sort((a, b) => a.price.newPrice - b.price.newPrice);
    if (sortOrder === "high-price") filteredProducts.sort((a, b) => b.price.newPrice - a.price.newPrice);

    const compareStrings = (a, b, ascending = true) => {
      const nameA = a.toUpperCase();
      const nameB = b.toUpperCase();
      
      if(nameA < nameB) return ascending ? -1 : 1;
      if(nameA > nameB) return ascending ? 1 : -1;
      return 0;
    };

    if(sortOrder === "A-Z") filteredProducts.sort((a, b) => compareStrings(a.name, b.name, true));
    if(sortOrder === "Z-A") filteredProducts.sort((a, b) => compareStrings(a.name, b.name, false));

    visibleCount = 6;
    RenderProducts(filteredProducts);
  };
    
  const LoadMore = () => {
    visibleCount += step;
    RenderProducts(filteredProducts);
  };

  const ToggleLoadMore = (total) => {
    const btn = CheckError(document.getElementById("load-more-btn"), "Load more dugme ne postoji!");
    if(!btn) return;
    btn.style.display = visibleCount >= total ? "none" : "inline-block";
  };

  const layoutButtons = document.querySelectorAll(".layout-btn");

  layoutButtons.forEach(button => {
    button.addEventListener("click", () => {
      const layout = button.dataset.layout;
      currentLayout = layout;
      RenderProducts(filteredProducts);
    });
  });

  const UpdatePriceRangeLabel = () => {
    const range = document.getElementById("price-range");
    document.getElementById("price-range-value").innerText = range.value;
  };

  filteredProducts = [...productData];
  RenderProducts(filteredProducts);

  document.getElementById("category-filter").addEventListener("change", ApplyFilters);
  document.getElementById("stock-filter").addEventListener("change", ApplyFilters);
  document.getElementById("price-range").addEventListener("input", () => {
    UpdatePriceRangeLabel();
    ApplyFilters();
  });
    document.getElementById("price-sort").addEventListener("change", ApplyFilters);


  document.getElementById("load-more-btn").addEventListener("click", LoadMore);
  
  document.querySelectorAll(".detail-item").forEach(item => {
    item.addEventListener("click", () => {
      const wrapper = item.parentElement;
      const content = wrapper.querySelector(".detail-content");

      if (content.classList.contains("open")) return;

      document.querySelectorAll(".detail-content").forEach(panel => {
        panel.classList.remove("open");
        panel.parentElement.querySelector(".detail-item").classList.remove("open-panel");
      });

      content.classList.add("open");
      item.classList.add("open-panel");
    });
  });
};

// KOD ZA CONTACT.HTML
const RunContactPageCode = () => {
  const firstLastNameRegex = /^[A-ZČĆŠĐŽ][a-zčćšđž]+(?:\s[A-ZČĆŠĐŽ][a-zčćšđž]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const messageRegex = /^[\s\S]*$/;

  const ShowError = (errorType, inputField, inputLabel, fieldName, length) => {
    if (inputField) {
      inputField.style.border = '2px solid red';
    }

    let errorMessage = '';
    switch(errorType) {
      case 'regex-fail':
        errorMessage = '* Wrong format!';
        break;
      case 'no-input':
        errorMessage = '* Can\'t be empty!';
        break;
      case 'min-length':
        errorMessage = `* Minimum ${length} characters!`;
        break;
      case 'radio-select':
        errorMessage = `* Please select one!`
        break;
      default:
        errorMessage = '* Invalid input!';
    }

    if(inputLabel) {
      inputLabel.innerHTML = `${fieldName} <span style="color:red;">${errorMessage}</span>`;
    }
  };

  const ClearError = (inputField, inputLabel, fieldName) => {
    if (inputField) inputField.style.border = '';
    if (inputLabel) inputLabel.innerHTML = fieldName;
  };

  const ValidateRegex = (regexPattern, testString) => {
    return regexPattern.test(testString);
  };

  const ValidateField = (input) => {
    if (!input) return true;

    const label = document.getElementById(input.id + 'Label');
    let fieldName = '';
    let regex = null;

    if(input.dataset.validate === 'email') {
      fieldName = 'Email';
      regex = emailRegex;
    } 
    else if(input.dataset.validate === 'firstName') {
      fieldName = 'First name';
      regex = firstLastNameRegex;
    } 
    else if(input.dataset.validate === 'lastName') {
      fieldName = 'Last name';
      regex = firstLastNameRegex;
    } 
    else if(input.dataset.validate === 'message') {
      fieldName = 'Message';
      regex = messageRegex;
    } 
    else return true; 

    const value = input.value.trim();
    ClearError(input, label, fieldName);

    if(value === '') {
      ShowError('no-input', input, label, fieldName);
      return false;
    }
    if(regex && !ValidateRegex(regex, value)) {
      ShowError('regex-fail', input, label, fieldName);
      return false;
    }
    if(fieldName === 'Message' && value.length < 20) {
      ShowError('min-length', input, label, fieldName, 20);
      return false;
    }

    return true;
  };

  const ValidateRadioGroup = (name, labelElement, fieldName) => {
    const selected = document.querySelector(`input[name="${name}"]:checked`);

    if (!selected) {
      ShowError('radio-select', null, labelElement, fieldName);
      return false;
    }

    ClearError(null, labelElement, fieldName);
    return true;
  };

  const ValidateFormSubmit = () => {
    let validity = true;

    const inputs = ['firstName', 'lastName', 'email', 'message'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if(!ValidateField(el)) validity = false;
    });

    const questionLabel = document.getElementById('questionLabel');
    if (!ValidateRadioGroup("question", questionLabel, "Question type:")) validity = false;

    return validity;
  };

  const form = document.getElementById('contact-form');
  if (!form) return;

  document.querySelectorAll('input[data-validate], textarea[data-validate]').forEach(el => {
    el.addEventListener('input', () => ValidateField(el));
  });

  document.querySelectorAll('input[name="question"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const label = document.getElementById('questionLabel');
      ValidateRadioGroup('question', label, 'Question type:');
    });
  });

  form.addEventListener('submit', (e) => {
    if (!ValidateFormSubmit()) {
      e.preventDefault();
      return false;
    }
  });

  const map = document.getElementById('google-map');
  const mapImage = document.getElementsByClassName('google-map-popup')[0];
  if (map && mapImage) {
    map.addEventListener('mouseenter', () => {
      mapImage.style.transform = "translateX(-50%) translateY(0px)";
      mapImage.style.opacity = "1";
    });
    map.addEventListener('mouseleave', () => {
      mapImage.style.transform = "translateX(-50%) translateY(20px)";
      mapImage.style.opacity = "0";
    });
  }

  const btn = document.getElementById("add-review-btn");
  const textInput = document.getElementById("review-text");
  const ratingInput = document.getElementById("review-rating");
  const reviewsContainer = document.getElementById("reviews");

  let reviews = [];
  let reviewCount = 0;

  const SaveReviews = () => {
    localStorage.setItem('contactReviews', JSON.stringify(reviews));
  };

  const LoadReviews = () => {
    const saved = localStorage.getItem('contactReviews');
    if (saved) {
      reviews = JSON.parse(saved);
      reviewCount = reviews.length;
      reviews.forEach(r => RenderReview(r));
    }
  };

  const RenderReview = (r) => {
    const div = document.createElement("div");
    div.className = "d-flex align-items-start mb-2 w-100";

    const stars = "Rating: " + "★ ".repeat(r.rating) + "☆ ".repeat(5 - r.rating);

    div.innerHTML = `
      <div class="me-3 fw-bold d-flex justify-content-center align-items-center rounded mt-1" style="
        width: 40px; 
        height: 40px; 
        background-color: #C29C6C; 
        flex-shrink: 0;">
        ${r.index}
      </div>
      <div style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; max-width: 90%;">
        <strong>${stars}</strong>
        <p>${r.text}</p>
        <p class="mb-3 text-secondary">Post date: ${r.date}</p>
      </div>
    `;
    reviewsContainer.appendChild(div);
  };

  LoadReviews();

  btn.addEventListener("click", () => {
    const text = textInput.value.trim();
    const selectedValue = ratingInput.value;

    if (!text) return;

    reviewCount++;
    const dateObj = new Date();
    const dateFormat = dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear() + " " + dateObj.getHours() + ":" + dateObj.getMinutes();

    const ratingMap = { "1": 5, "2": 4, "3": 3, "4": 2, "5": 1 };
    const realRating = ratingMap[selectedValue];

    const newReview = {
      index: reviewCount,
      text: text,
      rating: realRating,
      date: dateFormat
    };

    reviews.push(newReview);
    SaveReviews();
    RenderReview(newReview);

    textInput.value = "";
    ratingInput.value = "1";
  });
};
