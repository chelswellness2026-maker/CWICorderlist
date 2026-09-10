/* =========================================================
   CWIC CHELS WELLNESS INTERNATIONAL
   ORDER MANAGEMENT SYSTEM
   script.js
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbwxMcp_0xPauiZTp7tWe7_Q9iWqLS32u8h5yXyXfS9l_DNxJTQE2sLe6JTdlLjnNYxF/exec";

const PRODUCTS = [
    "Septillion",
    "Coffee",
    "Soap",
    "Serum"
];

let currentUser = null;
let orders = [];
let productRowCounter = 0;
let toastTimer = null;


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeApplication();

    /* Login form */
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    /* Save order */
    const saveOrderButton =
        document.getElementById("saveOrderButton");

    if (saveOrderButton) {
        saveOrderButton.addEventListener("click", saveOrder);
    }

    /* Add product */
    const addProductButton =
        document.getElementById("addProductButton");

    if (addProductButton) {
        addProductButton.addEventListener(
            "click",
            addProductRow
        );
    }

    const emptyAddProductButton =
        document.getElementById("emptyAddProductButton");

    if (emptyAddProductButton) {
        emptyAddProductButton.addEventListener(
            "click",
            addProductRow
        );
    }

    /* Logout */
    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    /* Navigation buttons */
    setupNavigation();

    /* Product table events */
    setupProductEvents();

    /* Modal */
    setupModal();

});


/* =========================================================
   INITIALIZE APPLICATION
   ========================================================= */

function initializeApplication() {

    const savedUser =
        localStorage.getItem("cwicCurrentUser");

    if (!savedUser) {
        showLoginScreen();
        return;
    }

    try {

        const user = JSON.parse(savedUser);

        if (!user || !user.email) {
            localStorage.removeItem("cwicCurrentUser");
            showLoginScreen();
            return;
        }

        const email =
            String(user.email)
                .trim()
                .toLowerCase();

        showLoading("Checking authorization...");

        apiRequest("login", {
            email: email
        })
        .then(function (result) {

            if (!result || !result.success) {

                localStorage.removeItem(
                    "cwicCurrentUser"
                );

                currentUser = null;

                showLoginScreen();

                return;
            }

            currentUser = {
                ...(result.user || {}),
                email: String(
                    result.user?.email || email
                )
                    .trim()
                    .toLowerCase()
            };

            localStorage.setItem(
                "cwicCurrentUser",
                JSON.stringify(currentUser)
            );

            showApplication();

            loadOrders();

        })
        .catch(function (error) {

            console.error(
                "Initialization error:",
                error
            );

            localStorage.removeItem(
                "cwicCurrentUser"
            );

            currentUser = null;

            showLoginScreen();

        })
        .finally(function () {

            hideLoading();

        });

    } catch (error) {

        console.error(
            "Invalid saved user:",
            error
        );

        localStorage.removeItem(
            "cwicCurrentUser"
        );

        currentUser = null;

        showLoginScreen();
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

function handleLogin(event) {

    event.preventDefault();

    const emailInput =
        document.getElementById("loginEmail");

    const loginButton =
        document.getElementById("loginButton");

    const email =
        String(emailInput?.value || "")
            .trim()
            .toLowerCase();

    if (!email) {

        showLoginMessage(
            "Please enter your email address.",
            "error"
        );

        return;
    }

    if (!email.includes("@")) {

        showLoginMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }

    if (loginButton) {

        loginButton.disabled = true;

        loginButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
    }

    showLoading(
        "Checking authorization..."
    );

    apiRequest("login", {
        email: email
    })

    .then(function (result) {

        if (!result || !result.success) {

            showLoginMessage(
                result && result.message
                    ? result.message
                    : "Login failed.",
                "error"
            );

            return;
        }

        /*
         * IMPORTANT:
         * Always preserve the email that was entered
         * during login.
         */
        currentUser = {
            ...(result.user || {}),
            email: String(
                result.user?.email || email
            )
                .trim()
                .toLowerCase()
        };

        localStorage.setItem(
            "cwicCurrentUser",
            JSON.stringify(currentUser)
        );

        hideLoginMessage();

        showApplication();

        loadOrders();

        showToast(
            "Welcome",
            "You are successfully signed in.",
            "success"
        );

    })

    .catch(function (error) {

        console.error(
            "Login error:",
            error
        );

        showLoginMessage(
            error.message ||
            "Unable to sign in.",
            "error"
        );

    })

    .finally(function () {

        hideLoading();

        if (loginButton) {

            loginButton.disabled = false;

            loginButton.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }

    });
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to sign out?"
        );

    if (!confirmed) {
        return;
    }

    currentUser = null;
    orders = [];

    localStorage.removeItem(
        "cwicCurrentUser"
    );

    const loginEmail =
        document.getElementById("loginEmail");

    if (loginEmail) {
        loginEmail.value = "";
    }

    showLoginScreen();

    showToast(
        "Signed Out",
        "You have been signed out.",
        "success"
    );
}


/* =========================================================
   SHOW LOGIN SCREEN
   ========================================================= */

function showLoginScreen() {

    const loginScreen =
        document.getElementById("loginScreen");

    const appScreen =
        document.getElementById("appScreen");

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (appScreen) {
        appScreen.style.display = "none";
    }

    hideLoading();

}


/* =========================================================
   SHOW APPLICATION
   ========================================================= */

function showApplication() {

    const loginScreen =
        document.getElementById("loginScreen");

    const appScreen =
        document.getElementById("appScreen");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (appScreen) {
        appScreen.style.display = "block";
    }

    updateUserInterface();

    clearOrderForm();

}


/* =========================================================
   UPDATE USER INTERFACE
   ========================================================= */

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.name ||
        currentUser.email ||
        "User";

    const email =
        currentUser.email ||
        "";

    const role =
        currentUser.role ||
        "User";

    const roleLower =
        String(role)
            .trim()
            .toLowerCase();

    const isAdmin =
        roleLower === "admin";

    const userName =
        document.getElementById(
            "currentUserName"
        );

    const userEmail =
        document.getElementById(
            "currentUserEmail"
        );

    const userRole =
        document.getElementById(
            "currentUserRole"
        );

    const enteredBy =
        document.getElementById(
            "enteredBy"
        );

    if (userName) {
        userName.textContent = name;
    }

    if (userEmail) {
        userEmail.textContent = email;
    }

    if (userRole) {
        userRole.textContent = role;
    }

    if (enteredBy) {
        enteredBy.value = email;
    }

    /* Admin-only sections */

    document
        .querySelectorAll(".admin-only")
        .forEach(function (element) {

            element.style.display =
                isAdmin
                    ? ""
                    : "none";

        });

    const adminNavButton =
        document.getElementById(
            "adminNavButton"
        );

    if (adminNavButton) {
        adminNavButton.style.display =
            isAdmin
                ? ""
                : "none";
    }

    const grandTotalSummary =
        document.getElementById(
            "grandTotalSummary"
        );

    if (grandTotalSummary) {
        grandTotalSummary.style.display =
            isAdmin
                ? ""
                : "none";
    }

    const ordersDescription =
        document.getElementById(
            "ordersDescription"
        );

    if (ordersDescription) {

        ordersDescription.textContent =
            isAdmin
                ? "View and manage all customer orders."
                : "View the orders you have encoded.";
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll("[data-section]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const section =
                        button.dataset.section;

                    if (section) {
                        switchSection(section);
                    }

                }
            );

        });
}


function switchSection(sectionId) {

    document
        .querySelectorAll(".app-section")
        .forEach(function (section) {

            section.style.display =
                "none";

        });

    const target =
        document.getElementById(
            sectionId
        );

    if (target) {

        target.style.display =
            "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });

    if (sectionId === "ordersSection") {
        loadOrders();
    }

    if (
        sectionId === "adminSection" &&
        isCurrentUserAdmin()
    ) {
        loadOrders();
    }

}


/* =========================================================
   CHECK ADMIN
   ========================================================= */

function isCurrentUserAdmin() {

    if (!currentUser) {
        return false;
    }

    const role =
        String(
            currentUser.role || ""
        )
            .trim()
            .toLowerCase();

    return role === "admin";
}


/* =========================================================
   PRODUCT EVENTS
   ========================================================= */

function setupProductEvents() {

    const productContainer =
        document.getElementById(
            "productsContainer"
        );

    if (!productContainer) {
        return;
    }

    productContainer.addEventListener(
        "input",
        function (event) {

            if (
                event.target.classList.contains(
                    "quantity-input"
                ) ||
                event.target.classList.contains(
                    "amount-input"
                )
            ) {

                updateProductRowTotal(
                    event.target.closest(
                        ".product-row"
                    )
                );

                updateOrderTotal();
            }

        }
    );

    productContainer.addEventListener(
        "change",
        function (event) {

            if (
                event.target.classList.contains(
                    "product-select"
                )
            ) {

                updateOrderTotal();

            }

        }
    );

    productContainer.addEventListener(
        "click",
        function (event) {

            const deleteButton =
                event.target.closest(
                    ".remove-product"
                );

            if (!deleteButton) {
                return;
            }

            const row =
                deleteButton.closest(
                    ".product-row"
                );

            if (row) {

                row.remove();

                updateOrderTotal();

            }

        }
    );
}


/* =========================================================
   ADD PRODUCT ROW
   ========================================================= */

function addProductRow() {

    const container =
        document.getElementById(
            "productsContainer"
        );

    if (!container) {
        return;
    }

    productRowCounter++;

    const row =
        document.createElement("div");

    row.className =
        "product-row";

    row.dataset.rowId =
        productRowCounter;

    row.innerHTML = `
        <div class="product-field">
            <label>Product</label>
            <select class="product-select">
                <option value="">Select Product</option>
                ${PRODUCTS.map(function(product) {
                    return `
                        <option value="${escapeHtml(product)}">
                            ${escapeHtml(product)}
                        </option>
                    `;
                }).join("")}
            </select>
        </div>

        <div class="product-field">
            <label>Quantity</label>
            <input
                type="number"
                class="quantity-input"
                min="1"
                step="1"
                value="1"
            >
        </div>

        <div class="product-field">
            <label>Amount</label>
            <input
                type="number"
                class="amount-input"
                min="0"
                step="0.01"
                value="0"
            >
        </div>

        <div class="product-field">
            <label>Total</label>
            <div class="product-row-total">
                0.00 QAR
            </div>
        </div>

        <div class="product-field product-action">
            <button
                type="button"
                class="remove-product btn-danger"
                title="Remove Product"
            >
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(row);

    updateProductRowTotal(row);

    updateOrderTotal();

}


/* =========================================================
   UPDATE PRODUCT ROW TOTAL
   ========================================================= */

function updateProductRowTotal(row) {

    if (!row) {
        return;
    }

    const quantityInput =
        row.querySelector(
            ".quantity-input"
        );

    const amountInput =
        row.querySelector(
            ".amount-input"
        );

    const totalElement =
        row.querySelector(
            ".product-row-total"
        );

    const quantity =
        Number(
            quantityInput?.value || 0
        );

    const amount =
        Number(
            amountInput?.value || 0
        );

    const total =
        quantity * amount;

    if (totalElement) {

        totalElement.textContent =
            formatMoney(total) +
            " QAR";

    }

}


/* =========================================================
   UPDATE ORDER TOTAL
   ========================================================= */

function updateOrderTotal() {

    const rows =
        document.querySelectorAll(
            ".product-row"
        );

    let total = 0;

    rows.forEach(function (row) {

        const quantity =
            Number(
                row.querySelector(
                    ".quantity-input"
                )?.value || 0
            );

        const amount =
            Number(
                row.querySelector(
                    ".amount-input"
                )?.value || 0
            );

        total +=
            quantity * amount;

    });

    const totalElements =
        document.querySelectorAll(
            ".order-total, #orderTotal, #grandTotal"
        );

    totalElements.forEach(
        function (element) {

            element.textContent =
                formatMoney(total) +
                " QAR";

        }
    );

}


/* =========================================================
   COLLECT PRODUCTS
   ========================================================= */

function collectProducts() {

    const rows =
        document.querySelectorAll(
            ".product-row"
        );

    const items = [];

    rows.forEach(function (row) {

        const product =
            row.querySelector(
                ".product-select"
            )?.value || "";

        const quantity =
            Number(
                row.querySelector(
                    ".quantity-input"
                )?.value || 0
            );

        const amount =
            Number(
                row.querySelector(
                    ".amount-input"
                )?.value || 0
            );

        if (
            product ||
            quantity ||
            amount
        ) {

            items.push({
                product: product,
                quantity: quantity,
                amount: amount,
                total: quantity * amount
            });

        }

    });

    return items;
}


/* =========================================================
   VALIDATE ORDER
   ========================================================= */

function validateOrder(data) {

    if (!data.orderDate) {
        return "Please select the order date.";
    }

    if (!data.senderName) {
        return "Please enter the sender name.";
    }

    if (!data.receiverName) {
        return "Please enter the receiver name.";
    }

    if (
        !data.items ||
        data.items.length === 0
    ) {
        return "Please add at least one product.";
    }

    for (
        let i = 0;
        i < data.items.length;
        i++
    ) {

        const item =
            data.items[i];

        if (!item.product) {

            return (
                "Please select a product for item " +
                (i + 1) +
                "."
            );

        }

        if (
            !Number.isFinite(
                Number(item.quantity)
            ) ||
            Number(item.quantity) <= 0
        ) {

            return (
                "Quantity must be greater than 0 for item " +
                (i + 1) +
                "."
            );

        }

        if (
            !Number.isFinite(
                Number(item.amount)
            ) ||
            Number(item.amount) < 0
        ) {

            return (
                "Amount cannot be negative for item " +
                (i + 1) +
                "."
            );

        }

    }

    return null;
}


/* =========================================================
   SAVE ORDER
   ========================================================= */

function saveOrder() {

    /*
     * IMPORTANT:
     * The user email must exist before creating an order.
     */
    if (
        !currentUser ||
        !currentUser.email
    ) {

        showToast(
            "Login Required",
            "Your login session is missing. Please sign in again.",
            "error"
        );

        localStorage.removeItem(
            "cwicCurrentUser"
        );

        currentUser = null;

        showLoginScreen();

        return;
    }

    const userEmail =
        String(
            currentUser.email || ""
        )
            .trim()
            .toLowerCase();

    if (!userEmail) {

        showToast(
            "User Email Required",
            "Your account email could not be detected. Please sign in again.",
            "error"
        );

        return;
    }

    const data = {

        /*
         * Send both names to support
         * the Apps Script backend.
         */
        email: userEmail,

        userEmail: userEmail,

        orderDate:
            document.getElementById(
                "orderDate"
            )?.value || "",

        senderName:
            document.getElementById(
                "senderName"
            )?.value.trim() || "",

        senderAddress:
            document.getElementById(
                "senderAddress"
            )?.value.trim() || "",

        senderContact:
            document.getElementById(
                "senderContact"
            )?.value.trim() || "",

        receiverName:
            document.getElementById(
                "receiverName"
            )?.value.trim() || "",

        receiverAddress:
            document.getElementById(
                "receiverAddress"
            )?.value.trim() || "",

        receiverContact:
            document.getElementById(
                "receiverContact"
            )?.value.trim() || "",

        items:
            collectProducts()

    };


    /* Validate */

    const validationError =
        validateOrder(data);

    if (validationError) {

        showOrderMessage(
            validationError,
            "error"
        );

        return;
    }


    /* Calculate total */

    const total =
        data.items.reduce(
            function (sum, item) {

                return (
                    sum +
                    (
                        Number(item.quantity) *
                        Number(item.amount)
                    )
                );

            },
            0
        );


    /* Confirmation */

    const confirmed =
        confirm(
            "Save this order?\n\n" +
            "Order Total: " +
            formatMoney(total) +
            " QAR"
        );

    if (!confirmed) {
        return;
    }


    /* Save button */

    const saveButton =
        document.getElementById(
            "saveOrderButton"
        );

    if (saveButton) {

        saveButton.disabled = true;

        saveButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    }


    showLoading(
        "Saving order to Google Sheets..."
    );


    /*
     * IMPORTANT:
     *
     * We send:
     *
     * data       = complete order JSON
     * email      = logged-in user email
     * userEmail  = logged-in user email
     *
     * This makes the frontend compatible
     * with either backend naming convention.
     */

    apiRequest(
        "createOrder",
        {

            data:
                JSON.stringify(data),

            email:
                userEmail,

            userEmail:
                userEmail

        }
    )

    .then(function (result) {

        console.log(
            "createOrder response:",
            result
        );

        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Unable to save order."
            );

        }


        /* Success message */

        showOrderMessage(
            "Order " +
            result.orderId +
            " was saved successfully.",
            "success"
        );


        showToast(
            "Order Saved",
            "Order " +
            result.orderId +
            " saved successfully.",
            "success"
        );


        /* Clear form */

        clearOrderForm();


        /* Reload orders */

        loadOrders();


        /* Go to orders */

        switchSection(
            "ordersSection"
        );

    })

    .catch(function (error) {

        console.error(
            "Save order error:",
            error
        );

        const message =
            error.message ||
            "Unable to save the order.";

        showOrderMessage(
            message,
            "error"
        );

        showToast(
            "Save Failed",
            message,
            "error"
        );

    })

    .finally(function () {

        hideLoading();

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save Order';

        }

    });

}


/* =========================================================
   LOAD ORDERS
   ========================================================= */

function loadOrders() {

    if (
        !currentUser ||
        !currentUser.email
    ) {
        return;
    }

    const email =
        String(
            currentUser.email
        )
            .trim()
            .toLowerCase();

    showLoading(
        "Loading orders..."
    );

    apiRequest(
        "getOrders",
        {
            email: email,
            userEmail: email
        }
    )

    .then(function (result) {

        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Unable to load orders."
            );

        }

        orders =
            Array.isArray(
                result.orders
            )
                ? result.orders
                : [];

        renderOrders(
            orders
        );

        updateOrderSummary(
            orders
        );

    })

    .catch(function (error) {

        console.error(
            "Load orders error:",
            error
        );

        showToast(
            "Orders Error",
            error.message ||
            "Unable to load orders.",
            "error"
        );

    })

    .finally(function () {

        hideLoading();

    });
}


/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderOrders(orderList) {

    const container =
        document.getElementById(
            "ordersContainer"
        );

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (tableBody) {

        tableBody.innerHTML = "";

        if (
            !orderList ||
            orderList.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <p>No orders found.</p>
                    </td>
                </tr>
            `;

            return;
        }

        orderList.forEach(
            function (order) {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        ${escapeHtml(
                            order.orderId ||
                            order.id ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDate(
                                order.orderDate
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            order.senderName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            order.receiverName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            order.receiverContact ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getItemsText(order)
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            getOrderTotal(order)
                        )}
                        QAR
                    </td>

                    <td>
                        ${escapeHtml(
                            order.enteredBy ||
                            order.email ||
                            order.userEmail ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            order.status ||
                            "Pending"
                        )}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="btn btn-small"
                            onclick="viewOrder('${escapeHtml(
                                order.orderId ||
                                order.id ||
                                ""
                            )}')"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View
                        </button>
                    </td>
                `;

                tableBody.appendChild(
                    row
                );

            }
        );

        return;
    }


    /* Card-style fallback */

    if (container) {

        container.innerHTML = "";

        if (
            !orderList ||
            orderList.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <p>No orders found.</p>
                </div>
            `;

            return;
        }

        orderList.forEach(
            function (order) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "order-card";

                card.innerHTML = `
                    <div class="order-card-header">
                        <strong>
                            ${escapeHtml(
                                order.orderId ||
                                order.id ||
                                "-"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                formatDate(
                                    order.orderDate
                                )
                            )}
                        </span>
                    </div>

                    <div class="order-card-body">

                        <p>
                            <strong>Sender:</strong>
                            ${escapeHtml(
                                order.senderName ||
                                "-"
                            )}
                        </p>

                        <p>
                            <strong>Receiver:</strong>
                            ${escapeHtml(
                                order.receiverName ||
                                "-"
                            )}
                        </p>

                        <p>
                            <strong>Contact:</strong>
                            ${escapeHtml(
                                order.receiverContact ||
                                "-"
                            )}
                        </p>

                        <p>
                            <strong>Total:</strong>
                            ${formatMoney(
                                getOrderTotal(order)
                            )}
                            QAR
                        </p>

                    </div>

                    <div class="order-card-footer">

                        <button
                            type="button"
                            class="btn btn-small"
                            onclick="viewOrder('${escapeHtml(
                                order.orderId ||
                                order.id ||
                                ""
                            )}')"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View Order
                        </button>

                    </div>
                `;

                container.appendChild(
                    card
                );

            }
        );
    }
}


/* =========================================================
   GET ORDER ITEMS TEXT
   ========================================================= */

function getItemsText(order) {

    let items =
        order.items ||
        order.products ||
        [];

    if (
        typeof items === "string"
    ) {

        try {
            items =
                JSON.parse(items);
        } catch (error) {
            return items;
        }

    }

    if (
        !Array.isArray(items)
    ) {
        return "-";
    }

    return items
        .map(function (item) {

            return (
                (item.product ||
                item.name ||
                "-") +
                " x " +
                (
                    item.quantity ||
                    0
                )
            );

        })
        .join(", ");
}


/* =========================================================
   GET ORDER TOTAL
   ========================================================= */

function getOrderTotal(order) {

    if (
        order.total !== undefined &&
        order.total !== null &&
        order.total !== ""
    ) {

        const total =
            Number(order.total);

        if (
            Number.isFinite(total)
        ) {
            return total;
        }
    }

    let items =
        order.items ||
        order.products ||
        [];

    if (
        typeof items === "string"
    ) {

        try {
            items =
                JSON.parse(items);
        } catch (error) {
            items = [];
        }

    }

    if (
        !Array.isArray(items)
    ) {
        return 0;
    }

    return items.reduce(
        function (sum, item) {

            return (
                sum +
                (
                    Number(
                        item.quantity || 0
                    ) *
                    Number(
                        item.amount || 0
                    )
                )
            );

        },
        0
    );
}


/* =========================================================
   UPDATE ORDER SUMMARY
   ========================================================= */

function updateOrderSummary(orderList) {

    const totalOrders =
        orderList.length;

    const totalValue =
        orderList.reduce(
            function (sum, order) {

                return (
                    sum +
                    getOrderTotal(order)
                );

            },
            0
        );


    const totalOrdersElements =
        document.querySelectorAll(
            "#totalOrders, .total-orders"
        );

    totalOrdersElements.forEach(
        function (element) {

            element.textContent =
                totalOrders;

        }
    );


    const totalValueElements =
        document.querySelectorAll(
            "#grandTotal, #grandTotalValue, .grand-total"
        );

    totalValueElements.forEach(
        function (element) {

            element.textContent =
                formatMoney(
                    totalValue
                ) +
                " QAR";

        }
    );


    /* Admin statistics */

    const adminTotalOrders =
        document.getElementById(
            "adminTotalOrders"
        );

    if (adminTotalOrders) {
        adminTotalOrders.textContent =
            totalOrders;
    }


    const adminTotalValue =
        document.getElementById(
            "adminTotalValue"
        );

    if (adminTotalValue) {

        adminTotalValue.textContent =
            formatMoney(
                totalValue
            ) +
            " QAR";

    }

}


/* =========================================================
   VIEW ORDER
   ========================================================= */

function viewOrder(orderId) {

    const order =
        orders.find(
            function (item) {

                return String(
                    item.orderId ||
                    item.id ||
                    ""
                ) ===
                String(orderId);

            }
        );

    if (!order) {

        showToast(
            "Order Not Found",
            "The selected order could not be found.",
            "error"
        );

        return;
    }

    const modal =
        document.getElementById(
            "orderModal"
        );

    const modalBody =
        document.getElementById(
            "orderModalBody"
        );

    if (!modal || !modalBody) {

        alert(
            buildOrderDetailsText(
                order
            )
        );

        return;
    }

    modalBody.innerHTML =
        buildOrderDetailsHtml(
            order
        );

    modal.style.display =
        "flex";

}


/* =========================================================
   BUILD ORDER DETAILS HTML
   ========================================================= */

function buildOrderDetailsHtml(order) {

    let items =
        order.items ||
        order.products ||
        [];

    if (
        typeof items === "string"
    ) {

        try {
            items =
                JSON.parse(items);
        } catch (error) {
            items = [];
        }

    }

    if (
        !Array.isArray(items)
    ) {
        items = [];
    }

    return `

        <div class="order-details">

            <div class="detail-row">
                <strong>Order ID</strong>
                <span>
                    ${escapeHtml(
                        order.orderId ||
                        order.id ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Order Date</strong>
                <span>
                    ${escapeHtml(
                        formatDate(
                            order.orderDate
                        )
                    )}
                </span>
            </div>

            <hr>

            <h4>Sender Information</h4>

            <div class="detail-row">
                <strong>Name</strong>
                <span>
                    ${escapeHtml(
                        order.senderName ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Address</strong>
                <span>
                    ${escapeHtml(
                        order.senderAddress ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Contact</strong>
                <span>
                    ${escapeHtml(
                        order.senderContact ||
                        "-"
                    )}
                </span>
            </div>

            <hr>

            <h4>Receiver Information</h4>

            <div class="detail-row">
                <strong>Name</strong>
                <span>
                    ${escapeHtml(
                        order.receiverName ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Address</strong>
                <span>
                    ${escapeHtml(
                        order.receiverAddress ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Contact</strong>
                <span>
                    ${escapeHtml(
                        order.receiverContact ||
                        "-"
                    )}
                </span>
            </div>

            <hr>

            <h4>Products</h4>

            <div class="order-items">

                ${
                    items.length
                    ? items.map(
                        function (item) {

                            return `
                                <div class="detail-row">
                                    <strong>
                                        ${escapeHtml(
                                            item.product ||
                                            item.name ||
                                            "-"
                                        )}
                                    </strong>

                                    <span>
                                        ${
                                            Number(
                                                item.quantity || 0
                                            )
                                        }
                                        ×
                                        ${
                                            formatMoney(
                                                Number(
                                                    item.amount || 0
                                                )
                                            )
                                        }
                                        =
                                        ${
                                            formatMoney(
                                                Number(
                                                    item.quantity || 0
                                                ) *
                                                Number(
                                                    item.amount || 0
                                                )
                                            )
                                        }
                                        QAR
                                    </span>
                                </div>
                            `;

                        }
                    ).join("")
                    : `
                        <p>No products recorded.</p>
                    `
                }

            </div>

            <hr>

            <div class="detail-row total-row">

                <strong>Order Total</strong>

                <span>
                    ${formatMoney(
                        getOrderTotal(order)
                    )}
                    QAR
                </span>

            </div>

            <div class="detail-row">
                <strong>Entered By</strong>
                <span>
                    ${escapeHtml(
                        order.enteredBy ||
                        order.email ||
                        order.userEmail ||
                        "-"
                    )}
                </span>
            </div>

            <div class="detail-row">
                <strong>Status</strong>
                <span>
                    ${escapeHtml(
                        order.status ||
                        "Pending"
                    )}
                </span>
            </div>

        </div>
    `;
}


/* =========================================================
   BUILD ORDER TEXT
   ========================================================= */

function buildOrderDetailsText(order) {

    return (
        "Order ID: " +
        (
            order.orderId ||
            order.id ||
            "-"
        ) +
        "\n\n" +

        "Order Date: " +
        formatDate(
            order.orderDate
        ) +
        "\n\n" +

        "Sender: " +
        (
            order.senderName ||
            "-"
        ) +
        "\n" +

        "Sender Address: " +
        (
            order.senderAddress ||
            "-"
        ) +
        "\n" +

        "Sender Contact: " +
        (
            order.senderContact ||
            "-"
        ) +
        "\n\n" +

        "Receiver: " +
        (
            order.receiverName ||
            "-"
        ) +
        "\n" +

        "Receiver Address: " +
        (
            order.receiverAddress ||
            "-"
        ) +
        "\n" +

        "Receiver Contact: " +
        (
            order.receiverContact ||
            "-"
        ) +
        "\n\n" +

        "Total: " +
        formatMoney(
            getOrderTotal(order)
        ) +
        " QAR"
    );
}


/* =========================================================
   CLEAR ORDER FORM
   ========================================================= */

function clearOrderForm() {

    const form =
        document.getElementById(
            "orderForm"
        );

    if (form) {

        form.reset();

    }


    const orderDate =
        document.getElementById(
            "orderDate"
        );

    if (orderDate) {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );

        orderDate.value =
            `${year}-${month}-${day}`;
    }


    const enteredBy =
        document.getElementById(
            "enteredBy"
        );

    if (enteredBy) {

        enteredBy.value =
            currentUser?.email || "";

    }


    const container =
        document.getElementById(
            "productsContainer"
        );

    if (container) {

        container.innerHTML = "";

        productRowCounter = 0;

        addProductRow();

    }


    updateOrderTotal();

    hideOrderMessage();

}


/* =========================================================
   ORDER MESSAGE
   ========================================================= */

function showOrderMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "orderMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "message " +
        (
            type === "success"
                ? "success"
                : "error"
        );

    element.style.display =
        "block";

}


function hideOrderMessage() {

    const element =
        document.getElementById(
            "orderMessage"
        );

    if (element) {

        element.style.display =
            "none";

        element.textContent =
            "";

    }

}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "loginMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "message " +
        (
            type === "success"
                ? "success"
                : "error"
        );

    element.style.display =
        "block";

}


function hideLoginMessage() {

    const element =
        document.getElementById(
            "loginMessage"
        );

    if (element) {

        element.style.display =
            "none";

        element.textContent =
            "";

    }

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }

    const toastTitle =
        toast.querySelector(
            ".toast-title"
        );

    const toastMessage =
        toast.querySelector(
            ".toast-message"
        );

    const toastIcon =
        toast.querySelector(
            ".toast-icon"
        );


    if (toastTitle) {
        toastTitle.textContent =
            title;
    }

    if (toastMessage) {
        toastMessage.textContent =
            message;
    }


    toast.className =
        "toast " +
        type;


    if (toastIcon) {

        if (type === "success") {

            toastIcon.innerHTML =
                '<i class="fa-solid fa-circle-check"></i>';

        } else if (type === "error") {

            toastIcon.innerHTML =
                '<i class="fa-solid fa-circle-exclamation"></i>';

        } else {

            toastIcon.innerHTML =
                '<i class="fa-solid fa-circle-info"></i>';

        }

    }


    toast.style.display =
        "flex";


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.style.display =
                    "none";

            },
            4000
        );
}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(message) {

    const loading =
        document.getElementById(
            "loadingOverlay"
        );

    if (!loading) {
        return;
    }

    const loadingText =
        loading.querySelector(
            ".loading-text"
        );

    if (loadingText) {

        loadingText.textContent =
            message ||
            "Please wait...";

    }

    loading.style.display =
        "flex";
}


function hideLoading() {

    const loading =
        document.getElementById(
            "loadingOverlay"
        );

    if (loading) {

        loading.style.display =
            "none";

    }

}


/* =========================================================
   MODAL
   ========================================================= */

function setupModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );

    if (!modal) {
        return;
    }

    const closeButtons =
        modal.querySelectorAll(
            ".modal-close, [data-close-modal]"
        );

    closeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                closeModal
            );

        }
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );

}


function closeModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );

    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================================================
   API REQUEST
   ========================================================= */

function apiRequest(
    action,
    parameters = {}
) {

    return new Promise(
        function (resolve, reject) {

            const callbackName =
                "cwicCallback_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 100000
                );

            let finished = false;

            const script =
                document.createElement(
                    "script"
                );

            const timeout =
                setTimeout(
                    function () {

                        if (finished) {
                            return;
                        }

                        finished = true;

                        cleanup();

                        reject(
                            new Error(
                                "Request timed out. Please check your internet connection and try again."
                            )
                        );

                    },
                    30000
                );


            function cleanup() {

                clearTimeout(
                    timeout
                );

                try {

                    delete window[
                        callbackName
                    ];

                } catch (error) {

                    window[
                        callbackName
                    ] = undefined;

                }

                if (
                    script.parentNode
                ) {

                    script.parentNode.removeChild(
                        script
                    );

                }

            }


            window[
                callbackName
            ] = function (response) {

                if (finished) {
                    return;
                }

                finished = true;

                cleanup();

                resolve(response);

            };


            script.onerror =
                function () {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    cleanup();

                    reject(
                        new Error(
                            "Unable to connect to Google Apps Script."
                        )
                    );

                };


            const query =
                new URLSearchParams();


            query.set(
                "action",
                action
            );


            query.set(
                "callback",
                callbackName
            );


            Object.keys(
                parameters
            ).forEach(
                function (key) {

                    const value =
                        parameters[key];

                    if (
                        value !== undefined &&
                        value !== null
                    ) {

                        query.set(
                            key,
                            String(value)
                        );

                    }

                }
            );


            script.src =
                API_URL +
                "?" +
                query.toString();


            document.body.appendChild(
                script
            );

        }
    );
}


/* =========================================================
   FORMAT MONEY
   ========================================================= */

function formatMoney(value) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "0.00";
    }

    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMobileMenu() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle(
        "open"
    );

    if (overlay) {

        overlay.classList.toggle(
            "active"
        );

    }
}


/* =========================================================
   CLOSE MOBILE MENU
   ========================================================= */

function closeMobileMenu() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.saveOrder =
    saveOrder;

window.logout =
    logout;

window.addProductRow =
    addProductRow;

window.viewOrder =
    viewOrder;

window.closeModal =
    closeModal;

window.switchSection =
    switchSection;

window.toggleMobileMenu =
    toggleMobileMenu;

window.closeMobileMenu =
    closeMobileMenu;