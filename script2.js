// =====================
// NAVBAR
// =====================
const hamburger = document.querySelector("#hamburger-menu");
const navMenu = document.querySelector("#nav-menu");
const shoppingCartBtn = document.querySelector("#shopping-cart-btn");
const cartCount = document.querySelector("#cart-count");

// Floating Cart
const floatingCart = document.querySelector("#floating-cart");
const floatingCartCount = document.querySelector("#floating-cart-count");
const floatingCartTotal = document.querySelector("#floating-cart-total");

// Drawer
const checkoutDrawer = document.querySelector("#checkout-drawer");
const checkoutOverlay = document.querySelector("#checkout-overlay");
const openCheckoutDrawerBtn = document.querySelector("#open-checkout-drawer");
const closeCheckoutDrawerBtn = document.querySelector("#close-checkout-drawer");
const drawerOrderList = document.querySelector("#drawer-order-list");
const drawerTotalPrice = document.querySelector("#drawer-total-price");
const drawerTableNumberInput = document.querySelector("#drawer-table-number");
const drawerCheckoutBtn = document.querySelector("#drawer-checkout-btn");
const drawerSuccessMessage = document.querySelector("#drawer-success-message");

// =====================
// HAMBURGER MENU
// =====================
hamburger.addEventListener("click", function (e) {
  e.preventDefault();
  navMenu.classList.toggle("active");
});

document.addEventListener("click", function (e) {
  if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
    navMenu.classList.remove("active");
  }
});

const navLinks = document.querySelectorAll(".navbar-nav a");
navLinks.forEach((link) => {
  link.addEventListener("click", function () {
    navMenu.classList.remove("active");
  });
});

// =====================
// DRAWER OPEN / CLOSE
// =====================
shoppingCartBtn.addEventListener("click", function (e) {
  e.preventDefault();
  openDrawer();
});

openCheckoutDrawerBtn.addEventListener("click", openDrawer);
closeCheckoutDrawerBtn.addEventListener("click", closeDrawer);
checkoutOverlay.addEventListener("click", closeDrawer);

function openDrawer() {
  checkoutDrawer.classList.add("active");
  checkoutOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  checkoutDrawer.classList.remove("active");
  checkoutOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

// =====================
// MENU TABS
// =====================
const menuTabs = document.querySelectorAll(".menu-tab");
const menuGroups = document.querySelectorAll(".menu-group");

menuTabs.forEach((tab) => {
  tab.addEventListener("click", function () {
    const category = this.dataset.category;
    menuTabs.forEach((item) => item.classList.remove("active"));
    menuGroups.forEach((group) => group.classList.remove("active"));
    this.classList.add("active");
    const activeGroup = document.querySelector(
      `.menu-group[data-category="${category}"]`,
    );
    if (activeGroup) activeGroup.classList.add("active");
  });
});

// =====================
// CART LOGIC
// =====================
let cart = [];

function formatRupiah(number) {
  return "Rp " + number.toLocaleString("id-ID");
}

function updateCartCount() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalQty;
  if (totalQty === 0) {
    cartCount.classList.add("hidden");
  } else {
    cartCount.classList.remove("hidden");
  }
}

function renderCart() {
  updateCartCount();

  if (cart.length === 0) {
    drawerOrderList.innerHTML = '<p class="empty-order">Belum ada pesanan.</p>';
    drawerTotalPrice.textContent = "Rp 0";
    floatingCart.classList.add("hidden");
    floatingCartCount.textContent = "0 item";
    floatingCartTotal.textContent = "Rp 0";
    return;
  }

  let html = "";
  let total = 0;
  let totalQty = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    totalQty += item.qty;
    html += `
      <div class="order-item">
        <img src="${item.image}" alt="${item.name}" class="order-item-img" />
        <div class="order-item-info">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-price">${formatRupiah(item.price)}</div>
          <div class="order-item-qty">Jumlah: ${item.qty}</div>
        </div>
        <div class="order-actions">
          <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
          <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
          <button class="remove-btn" onclick="removeItem(${index})">Hapus</button>
        </div>
      </div>
    `;
  });

  drawerOrderList.innerHTML = html;
  drawerTotalPrice.textContent = formatRupiah(total);
  floatingCart.classList.remove("hidden");
  floatingCartCount.textContent = `${totalQty} item`;
  floatingCartTotal.textContent = formatRupiah(total);
}

function addToCart(name, price, image) {
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }
  renderCart();
}

function changeQty(index, amount) {
  cart[index].qty += amount;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

window.changeQty = changeQty;
window.removeItem = removeItem;

const orderButtons = document.querySelectorAll(".order-btn");
orderButtons.forEach((button) => {
  button.addEventListener("click", function () {
    addToCart(
      this.dataset.name,
      parseInt(this.dataset.price),
      this.dataset.image,
    );
  });
});

// =====================
// CHECKOUT
// =====================
drawerCheckoutBtn.addEventListener("click", async function () {
  const tableNumber = drawerTableNumberInput.value.trim();

  if (cart.length === 0) {
    alert("Silakan tambahkan pesanan terlebih dahulu.");
    return;
  }
  if (tableNumber === "") {
    alert("Silakan isi nomor meja terlebih dahulu.");
    return;
  }

  try {
    drawerCheckoutBtn.disabled = true;
    drawerCheckoutBtn.textContent = "Memproses...";

    const grossAmount = cart.reduce(
      (total, item) => total + item.price * item.qty,
      0,
    );
    const orderItems = cart.map((item) => ({
      id: item.name.toLowerCase().replace(/\s+/g, "-"),
      name: item.name,
      price: item.price,
      quantity: item.qty,
    }));

    const payload = {
      order_id: "ORDER-" + Date.now(),
      gross_amount: grossAmount,
      table_number: tableNumber,
      items: orderItems,
      customer_details: { first_name: "Pelanggan Kenangan Senja" },
    };

    const response = await fetch("/api/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Gagal membuat transaksi.");

    window.snap.pay(data.token, {
      onSuccess: function () {
        drawerSuccessMessage.textContent =
          "Pembayaran berhasil. Pesanan Anda sedang disiapkan.";
        cart = [];
        renderCart();
        drawerTableNumberInput.value = "";
        closeDrawer();
      },
      onPending: function () {
        drawerSuccessMessage.textContent =
          "Pembayaran menunggu penyelesaian. Silakan lanjutkan pembayaran Anda.";
      },
      onError: function () {
        drawerSuccessMessage.textContent =
          "Pembayaran gagal. Silakan coba lagi.";
      },
      onClose: function () {
        drawerSuccessMessage.textContent =
          "Popup pembayaran ditutup sebelum transaksi selesai.";
      },
    });
  } catch (error) {
    console.error(error);
    alert(error.message || "Terjadi kesalahan saat memproses pembayaran.");
  } finally {
    drawerCheckoutBtn.disabled = false;
    drawerCheckoutBtn.textContent = "Bayar Sekarang";
  }
});

// Init
updateCartCount();
