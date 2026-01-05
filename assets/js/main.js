window.onload = () => {
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  RunUniversalPageCode();

  const body = document.querySelector('body');
  if (!body) {
    console.error('Greška: Nije pronađen body na stranici.');
    return;
  }

  const page = body.dataset.page;
  if (!page) {
    console.error('Greška: Nije pronadjen data-page atribut u body.')
    return;
  }

  if (page === 'index') RunIndexPageCode();
  else if (page === 'products') RunProductsPageCode();
  else if (page === 'contact') RunContactPageCode();
  else if (page === 'author');
  else if (page === 'message');
  else console.error(`Stranica sa imenom '${page}' ne postoji. Proveriti vrednost data-page atributa.`);
});

const RunUniversalPageCode = () => {
  const pageOverlay = document.getElementById('overlay');
  if (!pageOverlay) return;

  pageOverlay.classList.add('fade-out');
  setTimeout(() => pageOverlay.remove(), 1600);

  const mainNav = document.getElementById('main-nav');
  if (!mainNav) return;

  window.addEventListener('scroll', () => {
    mainNav.classList.toggle('main-nav-alt', window.scrollY > 0);
  });

  const buttonTop = document.getElementById('top-btn');
  if(!buttonTop) return;

  buttonTop.addEventListener('click', () => {
    window.scrollTo(0, 0);
  });
};

const products = [
  {name: "Sapphire Dining Table", price: 3850, category: "luxury", img: "assets/img/tables/luxury/sapphire-table.jpg", description: "Table only, handcrafted epoxy top"},
  {name: "Prestige Console Table", price: 2000, category: "luxury", img: "assets/img/tables/luxury/prestige-console.jpg", description: "Perfect for hallway or living room"},
  {name: "Rustic Farmhouse Table", price: 1100, category: "kitchen", img: "assets/img/tables/kitchen/rustic-farmhouse.jpg", description: "Handcrafted from reclaimed wood"},
  {name: "Nordic Coffee Table", price: 480, category: "living-room", img: "assets/img/tables/living-room/nordic-coffee.jpg", description: "Scandinavian minimalist style"},
  {name: "Ebony Full Table", price: 1500, category: "living-room", img: "assets/img/tables/living-room/ebony-table.jpg", description: "Ebony table only with epoxy top"},
  {name: "Maple Epoxy Desk", price: 2100, category: "luxury", img: "assets/img/tables/kitchen/maple-table.jpg", description: "Stylish workspace with epoxy top"},
  {name: "Cedar Dining Set", price: 650, category: "sets", img: "assets/img/tables/sets/cedar-set.jpg", description: "Cedar wood dining table with 2 chairs"},
  {name: "Luxury Oak Dining Table", price: 3350, category: "luxury", img: "assets/img/tables/luxury/luxury-oak.jpg", description: "Seats 8, handcrafted with oak and epoxy"},
  {name: "Venus Side Table", price: 650, category: "living-room", img: "assets/img/tables/living-room/venus-side.jpg", description: "Elegant side table for any modern interior"},
  {name: "Oak Dining Set", price: 3800, category: "sets", img: "assets/img/tables/sets/oak-set.jpg", description: "Oak wood table with 6 leather chairs"},
  {name: "Sublime Oak Table", price: 1800, category: "kitchen", img: "assets/img/tables/kitchen/sublime-oak.jpg", description: "Elegant kitchen dining table"}
];

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

  const featuredBtn = document.getElementById('featured-btn');
  if (!featuredBtn) return;
  featuredBtn.addEventListener('click', () => {
    const el = document.getElementById('featured-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });

  const slideshowImg1 = document.querySelector('#carousel-first');
  const slideshowImg2 = document.querySelector('#carousel-second');
  if (!slideshowImg1 || !slideshowImg2) return;

  let index = 0;
  setInterval(() => {
    const nextIndex = (index + 1) % products.length;

    slideshowImg1.src = products[index].img;
    slideshowImg2.src = products[nextIndex].img;

    [slideshowImg1, slideshowImg2].forEach(img => {
      img.classList.remove('flash-zoom');
      void img.offsetWidth;
      img.classList.add('flash-zoom');
    });

    index = (index + 2) % products.length;
  }, 7000);
};

const catalogueContent = document.getElementById("catalogue-content");

const RenderProducts = (productsArray) => {
  catalogueContent.innerHTML = "";
  productsArray.forEach(p => {
    const div = document.createElement("div");
    div.className = "col-12 col-sm-12 col-lg-4 col-md-6 mb-4";
    div.innerHTML = `
      <div class="card h-100 shadow-sm color-background-primary">
        <img src="${p.img}" class="card-img-top img-fluid h-100" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title text-uppercase color-text-secondary">${p.name}</h6>
          <p class="card-text text-truncate">${p.description}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="fw-bold btn btn-sm color-foreground-primary">$${p.price}</span>
          </div>
        </div>
      </div>
    `;
    catalogueContent.appendChild(div);
  });
};

const RunProductsPageCode = () => {
  RenderProducts(products);
  const priceFilter = document.getElementById("price-filter");
  const categoryFilter = document.getElementById("category-filter");
  const applyBtn = document.getElementById("apply-filters");

  applyBtn.addEventListener("click", () => {
    let filtered = products;

    const price = priceFilter.value;
    if(price !== "all"){
      filtered = filtered.filter(p => {
        if(price === "low") return p.price <= 1000;
        if(price === "medium") return p.price > 1000 && p.price <= 3000;
        if(price === "high") return p.price > 3000;
      });
    }

    const category = categoryFilter.value;
    if(category !== "all"){
      filtered = filtered.filter(p => p.category === category);
    }

    RenderProducts(filtered);
  });

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
};

const firstLastNameRegex = /^[A-ZČĆŠĐŽ][a-zčćšđž]+(?:\s[A-ZČĆŠĐŽ][a-zčćšđž]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const messageRegex = /^[a-zA-Z0-9 .,!?()'"-]*$/;

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

const RunContactPageCode = () => {
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
  map.addEventListener('mouseenter', () => {
    mapImage.style.transform = "translateX(-50%) translateY(0px)";
    mapImage.style.opacity = "1";
  });
  map.addEventListener('mouseleave', () => {
    mapImage.style.transform = "translateX(-50%) translateY(20px)";
    mapImage.style.opacity = "0";
  });

  const btn = document.getElementById("add-review-btn");
  const textInput = document.getElementById("review-text");
  const ratingInput = document.getElementById("review-rating");
  const reviewsContainer = document.getElementById("reviews");

  let reviewCount = 0;

  btn.addEventListener("click", () => {
    const text = textInput.value.trim();
    const selectedValue = ratingInput.value;

    if (!text) return;

    reviewCount++;

    const ratingMap = {
      "1": 5,
      "2": 4,
      "3": 3,
      "4": 2,
      "5": 1
    };

    const realRating = ratingMap[selectedValue];
    const stars = "Rating: " + "★ ".repeat(realRating) + "☆ ".repeat(5 - realRating);

    const div = document.createElement("div");
    div.className = "d-flex align-items-start mb-2 w-100";

    const d = new Date();
    const dateFormat = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();

    div.innerHTML = `
      <div class="me-3 fw-bold d-flex justify-content-center align-items-center rounded mt-1" style="
        width: 40px; 
        height: 40px; 
        background-color: #C29C6C; 
        flex-shrink: 0;">
        ${reviewCount}
      </div>
      <div style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; max-width: 90%;">
        <strong>${stars}</strong>
        <p>${text}</p>
        <p class="mb-3 text-secondary">Post date: ${dateFormat}</p>
      </div>
    `;

    reviewsContainer.appendChild(div);

    textInput.value = "";
    ratingInput.value = "1";
  });
};
