window.addEventListener('load', function() {
    fetchAndAddEventListeners(); 
    if (window.location.pathname === '/buy') {
        calculateAndDisplayTotals();
    }   
});
const goToSignUp = () => location.href = '/signUp';

function fetchAndAddEventListeners() {
    fetchSuperheroes()
    .then(originalHeroesArr => {
        const productsContainer = document.querySelector("#ProductsContainer"); // Check if ProductsContainer exists before calling displaySuperHeroes
        if (productsContainer) {
            displaySuperHeroes(originalHeroesArr);
            addBoughtItems();
        }
        const selectElement = document.querySelector('#sortOption');         
        if (selectElement) {
            selectElement.addEventListener('change', () => {
                selectHandler(originalHeroesArr);
            });
        }
        const searchInput = document.querySelector('#search');
        if (searchInput) {
            searchInput.addEventListener('input', search);
        }
        const buyButton = document.querySelector('#buyButton');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                window.location.href = '/buy'; 
            });
        }
    });
};

const isEmailValid = email => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);

const isPasswordStrong = password => password.length >= 8;

function displayResponse(message) {
    let msgElement = document.querySelector('#msgElement');
    
    if (!msgElement) {
        msgElement = document.createElement('div');
        msgElement.id = 'msgElement';
        document.body.appendChild(msgElement);
    }
    msgElement.textContent = message;
};
function fetchSuperheroes() {
    return fetch('/products/superheroes')
      .then(res => res.json())
      .then(superheroesarr => {
          return superheroesarr.map(hero => ({
              productName: hero.productName,
              price: hero.price
          }));
      });
};

function displaySuperHeroes(heroesarr) {
    const ProductsContainer = document.querySelector("#ProductsContainer"); 
    ProductsContainer.innerHTML = '';
    
    heroesarr.forEach((hero) => {
        const heroDiv = document.createElement('div');
        heroDiv.className = 'heroDiv';
        heroDiv.dataset.name = hero.productName;
        heroDiv.dataset.price = hero.price;
        heroDiv.innerText = `${hero.productName} - $${hero.price}`;
        ProductsContainer.appendChild(heroDiv);
    });
};

function selectHandler(originalHeroesArr) {
    const heroesArr = [...originalHeroesArr];
    const selectedOption = document.querySelector('#sortOption').value;
    
    heroesArr.sort((a, b) => {
        if (selectedOption === 'price') {
            return a.price - b.price;
        }
        if (selectedOption === 'name') {
            return a.productName.localeCompare(b.productName, 'en', { sensitivity: 'base' });
        }
    });
    
    displaySuperHeroes(heroesArr);
};

function addBoughtItems() {
    const productContainer = document.querySelector('#ProductsContainer');
    const clickedProducts = [];

    productContainer.addEventListener('click', (event) => {

        if (event.target.classList.contains('heroDiv')) {
            const productName = event.target.dataset.name;
            const productPrice = parseFloat(event.target.dataset.price);
            clickedProducts.push({ productName, price: productPrice });
            sessionStorage.setItem('clickedProducts', JSON.stringify(clickedProducts));
        }
    });
};

function signUpFunc() {
    let userName = document.querySelector('#userName').value;
    let email = document.querySelector('#email').value;
    let password = document.querySelector('#password').value;

    if (!isEmailValid(email)) {
        displayResponse('Invalid Email Format');
        return;
    }

    if (!isPasswordStrong(password)) {
        displayResponse('Password has to be at least 8 characters');
        return;
    }

    fetch('/signUp', {
        headers: {"Content-Type": "application/json"},
        method: 'POST',
        body: JSON.stringify({ userName, email, password })
    })
    .then(res => {
        if (res.ok) {
            return res.json().then(data => window.location.href = '/');
        } else {
            return res.json().then(data => {
                if (data.error === 'Email exist') {
                    displayResponse(data.message);
                } else if (data.error === 'userName exist') {
                    displayResponse(data.message);
                } else {
                    displayResponse('An unknown error occurred');
                }
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayResponse('An error occurred during sign up');
    });
};

function signInFunc() {
    let email = document.querySelector('#email').value;
    let password = document.querySelector('#password').value;

    if (!email || !password) {
        displayResponse('Email and password are required');
        return; 
    }
    fetch('/', {
        headers: { "Content-Type": "application/json"},
        method: 'POST',
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            let errorMessage = data.error === 'no email' ? 'Email not found' : 
                               data.error === 'wrong password' ? 'Wrong password' : 
                               'An unknown error occurred';
            displayResponse(errorMessage);
        } else {
            sessionStorage.setItem('userName', data.userName);  // Add the user name to the storage session
            window.location.href = '/products';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayResponse('An error occurred during sign in');
    });
}

function search() {
    let searchTerm = document.querySelector('#search').value;
    fetch('/search', {
        headers: { "Content-Type": "application/json"},
        method: 'POST',
        body: JSON.stringify({
            searchTerm
        })
    })
    .then(res => res.json())
    .then(data => {
        let parsedArr = data.map(searchedProduct => ({
            productName: searchedProduct.productName,
            price: searchedProduct.price
        }))
        displaySuperHeroes(parsedArr);
    })
}

function calculateAndDisplayTotals() {
    const clickedProducts = JSON.parse(sessionStorage.getItem('clickedProducts')) || [];
    let totalPrice = 0;
    let totalProducts = clickedProducts.length;

    clickedProducts.forEach(product => {
        totalPrice += product.price;
    });

     document.querySelector('#totalProduct').textContent = `Total Products: ${totalProducts}`;
     document.querySelector('#totalPrice').textContent = `Total Price: $${totalPrice.toFixed(2)}`;
}

function finalizePurchase() {
    let products = JSON.parse(sessionStorage.getItem('clickedProducts')) || [];
    let userName = sessionStorage.getItem('userName');

    fetch('/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, userName })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.text();
    })
    .then(data => {
      let parsedData = JSON.parse(data);
      console.log(parsedData.message);
      
      logoutUser();
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
    });
  }

  function fetchAllOrders() {
    fetch('/all/data?admin=true')
    .then(res => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(data => {
        const orderContainer = document.getElementById('orderContainer');
        orderContainer.innerHTML = ''; // Clear previous content

        data.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('heroDiv');

            let productsList = order.OrderedProducts.join(', '); // Create a string of products

            orderDiv.innerHTML = `
                <h3>User: ${order.userName}</h3>
                <p>Order Details: ${productsList}</p>
            `;

            orderContainer.appendChild(orderDiv);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
  function logoutUser() {
    sessionStorage.clear();  // clear session storage
    window.location.href = '/';  // Redirect to the sign-in page
}