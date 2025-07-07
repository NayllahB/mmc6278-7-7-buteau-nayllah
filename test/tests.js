const { expect } = require("chai");
const request = require("supertest");
const {
  configure,
  getByText,
  getByLabelText,
} = require("@testing-library/dom");
require('dotenv').config()
if (!process.env.SESSION_SECRET) {
  console.log("\x1b[31m%s\x1b[0m", `SESSION_SECRET is missing!`)
  console.log("\x1b[33m%s\x1b[0m", `Setting SESSION_SECRET before running test suite...`)
  console.log("\x1b[33m%s\x1b[0m", `Don't forget to create the .env file for local development.`)
  process.env.SESSION_SECRET = 'banana_meatloaf'
}
const { JSDOM } = require("jsdom");
const app = require("../app");
const db = require("../db");
const fs = require("fs/promises");

configure({
  getElementError(message) {
    const error = new Error(message);
    error.name = "TestingLibraryElementError";
    error.stack = null;
    return error;
  },
});

const cart = {
  cartItems: [
    {
      id: 505,
      inventoryId: 1,
      quantity: 1,
      price: 599.99,
      calculatedPrice: "599.99",
      name: "Stratocaster",
      image: "strat.jpg",
      inventoryQuantity: 3,
    },
    {
      id: 506,
      inventoryId: 6,
      quantity: 1,
      price: 29.99,
      calculatedPrice: "29.99",
      name: "Strap",
      image: "strap.jpg",
      inventoryQuantity: 20,
    },
    {
      id: 507,
      inventoryId: 7,
      quantity: 1,
      price: 9.99,
      calculatedPrice: "9.99",
      name: "Assortment of Picks",
      image: "picks.jpg",
      inventoryQuantity: 50,
    },
    {
      id: 508,
      inventoryId: 9,
      quantity: 3,
      price: 19.99,
      calculatedPrice: "59.97",
      name: "Instrument Cable",
      image: "cable.jpg",
      inventoryQuantity: 15,
    },
    {
      id: 509,
      inventoryId: 2,
      quantity: 1,
      price: 49.99,
      calculatedPrice: "49.99",
      name: "Mini Amp",
      image: "amp.jpg",
      inventoryQuantity: 10,
    },
  ],
  total: 749.93,
};

const inventory = [
  {
    id: 1,
    name: "Stratocaster",
    image: "strat.jpg",
    description: "One of the most iconic electric guitars ever made.",
    price: 599.99,
    quantity: 3,
  },
  {
    id: 2,
    name: "Mini Amp",
    image: "amp.jpg",
    description:
      "A small practice amp that shouldn't annoy roommates or neighbors.",
    price: 49.99,
    quantity: 10,
  },
  {
    id: 3,
    name: "Bass Guitar",
    image: "bass.jpg",
    description: "A four string electric bass guitar.",
    price: 399.99,
    quantity: 10,
  },
  {
    id: 4,
    name: "Acoustic Guitar",
    image: "acoustic.jpg",
    description: "Perfect for campfire sing-alongs.",
    price: 799.99,
    quantity: 4,
  },
  {
    id: 5,
    name: "Ukulele",
    image: "ukulele.jpg",
    description: "A four string tenor ukulele tuned GCEA.",
    price: 99.99,
    quantity: 15,
  },
  {
    id: 6,
    name: "Strap",
    image: "strap.jpg",
    description:
      "Woven instrument strap keeps your guitar or bass strapped to you to allow playing while standing.",
    price: 29.99,
    quantity: 20,
  },
  {
    id: 7,
    name: "Assortment of Picks",
    image: "picks.jpg",
    description: "Picks for acoustic or electric players.",
    price: 9.99,
    quantity: 50,
  },
  {
    id: 8,
    name: "Guitar Strings",
    image: "strings.jpg",
    description:
      "High quality wound strings for your acoustic or electric guitar or bass.",
    price: 12.99,
    quantity: 20,
  },
  {
    id: 9,
    name: "Instrument Cable",
    image: "cable.jpg",
    description:
      "A cable to connect an electric guitar or bass to an amplifier.",
    price: 19.99,
    quantity: 15,
  },
];

describe("e-commerce site", () => {
  after(async () => {
    await db.query(`DELETE FROM sessions;`);
    await db.end();
  });
  describe("static files", () => {
    const files = ["style.css", "index.js"];
    for (const file of files) {
      it(`/${file} should serve ${file}`, async () => {
        const response = await request(app).get(`/${file}`);
        expect(response.status).to.eq(200);
        const fileText = await fs.readFile(`public/${file}`, "UTF-8");
        expect(response.text).to.eq(fileText);
      });
    }
    const images = [
      "acoustic",
      "bass",
      "picks",
      "strat",
      "ukulele",
      "amp",
      "cable",
      "strap",
      "strings",
    ];
    for (const image of images) {
      it(`/images/${image}.jpg should serve ${image} image`, async () => {
        const response = await request(app).get(`/images/${image}.jpg`);
        expect(response.status).to.eq(200);
        expect(response.headers["content-type"]).to.eq("image/jpeg");
      });
    }
  });
  describe("e-commerce api", () => {
    describe("authentication", () => {
      afterEach(async () => {
        await db.query("DELETE FROM users WHERE username=?", ["user3"]);
      });
      it("POST /api/user should create user and redirect to /login", async () => {
        const res = await request(app)
          .post("/api/user")
          .send({ username: "user3", password: "banana" });
        expect(res.status).to.eq(302);
        expect(res.headers.location).to.eq("/login");
        const [[user]] = await db.query(
          "SELECT * FROM users WHERE username=?",
          ["user3"]
        );
        expect(user.username).to.eq("user3");
      });
      it("POST /api/user should store password as hash", async () => {
        const res = await request(app)
          .post("/api/user")
          .send({ username: "user3", password: "banana" });
        expect(res.status).to.eq(302);
        expect(res.headers.location).to.eq("/login");
        const [[user]] = await db.query(
          "SELECT * FROM users WHERE username=?",
          ["user3"]
        );
        expect(user.username).to.eq("user3");
        const bcrypt = require("bcrypt");
        const passwordIsHashed = await bcrypt.compare("banana", user.password);
        expect(passwordIsHashed).to.be.true;
      });
      it("POST /api/user should return 400 if no login info is sent", async () => {
        const res = await request(app).post("/api/user");
        expect(res.status).to.eq(400);
      });
      it("POST /api/user should return 400 if no username is sent", async () => {
        const res = await request(app)
          .post("/api/user")
          .send({ password: "banana" });
        expect(res.status).to.eq(400);
      });
      it("POST /api/user should return 400 if no password is sent", async () => {
        const res = await request(app)
          .post("/api/user")
          .send({ username: "user3" });
        expect(res.status).to.eq(400);
      });
      it("POST /api/login with correct username/pass should log user in and redirect to /", async () => {
        const res = await request(app)
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(res.status).to.eq(302);
        expect(res.headers.location).to.eq("/");
      });
      it("POST /api/login with wrong password return 400", async () => {
        const res = await request(app)
          .post("/api/login")
          .send({ username: "user", password: "wrongpass" });
        expect(res.status).to.eq(400);
      });
      it("POST /api/login with wrong username return 400", async () => {
        const res = await request(app)
          .post("/api/login")
          .send({ username: "wronguser", password: "password123" });
        expect(res.status).to.eq(400);
      });
      it("POST /api/login with no username/pass should return 400", async () => {
        const res = await request(app).post("/api/login");
        expect(res.status).to.eq(400);
      });
      it("POST /api/login with no username return 400", async () => {
        const res = await request(app)
          .post("/api/login")
          .send({ password: "password123" });
        expect(res.status).to.eq(400);
      });
      it("POST /api/login with no password return 400", async () => {
        const res = await request(app)
          .post("/api/login")
          .send({ username: "wronguser" });
        expect(res.status).to.eq(400);
      });
      it("GET /api/logout should log user out and redirect to /", async () => {
        const res = await request(app).get("/api/logout");
        expect(res.status).to.eq(302);
        expect(res.headers.location).to.eq("/");
      });
      for (const method of ["POST", "DELETE"]) {
        it(`${method} /api/cart should redirect to /login if not logged in`, async () => {
          const res = await request(app)[method.toLowerCase()]("/api/cart");
          expect(res.status).to.eq(302);
        });
      }
      for (const method of ["PUT", "DELETE"]) {
        it(`${method} /api/cart/:id should redirect to /login if not logged in`, async () => {
          const res = await request(app)[method.toLowerCase()]("/api/cart/1");
          expect(res.status).to.eq(302);
        });
      }
      it("Logging in should allow access to cart page", async () => {
        const agent = request.agent(app);
        const loginResult = await agent
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(loginResult.status).to.eq(302);
        expect(loginResult.headers.location).to.eq("/");
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
      });
      it("Logging out should NOT allow access to cart page", async () => {
        const agent = request.agent(app);
        const loginResult = await agent
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(loginResult.status).to.eq(302);
        expect(loginResult.headers.location).to.eq("/");
        const cartResultLoggedIn = await agent.get("/cart");
        expect(cartResultLoggedIn.status).to.eq(200);
        expect(cartResultLoggedIn.headers["content-type"]).to.include("html");
        const logoutResult = await agent.get("/api/logout");
        expect(logoutResult.status).to.eq(302);
        expect(logoutResult.headers.location).to.eq("/");
        const cartResultLoggedOut = await agent.get("/cart");
        expect(cartResultLoggedOut.status).to.eq(302);
        expect(cartResultLoggedOut.headers.location).to.eq("/login");
      });
    });
    describe("cart", () => {
      const agent = request.agent(app);
      before(async () => {
        const res = await agent
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(res.headers["set-cookie"]).to.exist;
      });
      beforeEach(async () => {
        await db.query(`DELETE FROM cart;`);
        await db.query(`
          INSERT INTO cart (user_id, inventory_id, quantity)
          VALUES
            (1, 1, 1),
            (1, 6, 1),
            (1, 7, 1),
            (1, 9, 3),
            (1, 2, 1),
            (2, 4, 1),
            (2, 7, 1);
        `);
      });
      it("POST /api/cart should add to cart", async () => {
        const newCartItem = {
          inventoryId: 5,
          quantity: 1,
        };
        const res = await agent
          .post(`/api/cart?inventoryId=${newCartItem.inventoryId}`)
          .send({ quantity: newCartItem.quantity });
        const [[addedItem]] = await db.query(
          "SELECT quantity, inventory_id AS inventoryId FROM cart WHERE inventory_id = 5"
        );
        expect(newCartItem).to.deep.eq(addedItem);
      });
      it("POST /api/cart should return 404 if inventory item does not exist", async () => {
        const newCartItem = {
          inventoryId: 99,
          quantity: 1,
        };
        const res = await agent.post("/api/cart").send(newCartItem);
        const [[addedItem]] = await db.query(
          "SELECT quantity, inventory_id AS inventoryId FROM cart WHERE inventory_id = 5"
        );
        expect(res.status).to.eq(404);
        expect(addedItem).to.not.exist;
      });
      it("POST /api/cart should return 409 if item quantity is insufficient", async () => {
        const newCartItem = {
          inventoryId: 5,
          quantity: 99,
        };
        const res = await agent
          .post(`/api/cart?inventoryId=${newCartItem.inventoryId}`)
          .send({ quantity: newCartItem.quantity });
        const [[addedItem]] = await db.query(
          "SELECT quantity, inventory_id AS inventoryId FROM cart WHERE inventory_id = 5"
        );
        expect(res.status).to.eq(409);
        expect(addedItem).to.not.exist;
      });
      it("PUT /api/cart/:id should change cart quantity", async () => {
        const itemToChange = {
          inventory_id: 3,
          quantity: 2,
        };
        await db.query(
          `INSERT INTO cart (inventory_id, quantity, user_id) VALUES (3,3,1)`
        );
        const [[addedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        const res = await agent
          .put(`/api/cart/${addedItem.id}`)
          .send(itemToChange);
        const [[changedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        expect(changedItem).to.deep.eq({ ...addedItem, ...itemToChange });
      });
      it("PUT /api/cart/:id should return 404 if cart item does not exist", async () => {
        const itemToChange = {
          inventory_id: 3,
          quantity: 2,
        };
        await db.query(
          `INSERT INTO cart (inventory_id, quantity, user_id) VALUES (3,3,1)`
        );
        const [[addedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        const res = await agent.put(`/api/cart/99`).send(itemToChange);
        expect(res.status).to.eq(404);
        const [[unchangedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        expect(unchangedItem).to.deep.eq(addedItem);
      });
      it("PUT /api/cart/:id should return 409 if inventory quantity insufficient", async () => {
        const itemToChange = {
          inventory_id: 3,
          quantity: 99,
        };
        await db.query(
          `INSERT INTO cart (inventory_id, quantity, user_id) VALUES (3,3,1)`
        );
        const [[addedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        const res = await agent
          .put(`/api/cart/${addedItem.id}`)
          .send(itemToChange);
        expect(res.status).to.eq(409);
        const [[unchangedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        expect(unchangedItem).to.deep.eq(addedItem);
      });
      it("DELETE /api/cart/:id should remove cart item", async () => {
        await db.query(
          `INSERT INTO cart (inventory_id, quantity, user_id) VALUES (3,3,1)`
        );
        const [[addedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3`
        );
        const res = await agent.delete(`/api/cart/${addedItem.id}`);
        const [[deletedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        expect(deletedItem).to.not.exist;
      });
      it("DELETE /api/cart/:id should return 404 if cart item does not exist", async () => {
        await db.query(
          `INSERT INTO cart (inventory_id, quantity, user_id) VALUES (3,3,1)`
        );
        const [[addedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3`
        );
        const res = await agent.delete(`/api/cart/99`);
        expect(res.status).to.eq(404);
        const [[undeletedItem]] = await db.query(
          `SELECT * FROM cart WHERE inventory_id=3 AND user_id=1`
        );
        expect(addedItem).to.deep.eq(undeletedItem);
      });
      it("DELETE /api/cart/ should empty cart", async () => {
        const res = await agent.delete(`/api/cart`);
        const [[{ count }]] = await db.query(
          `SELECT count(*) as count FROM cart WHERE user_id=1`
        );
        expect(count).to.eq(0);
        await db.query(`
          INSERT INTO cart (user_id, inventory_id, quantity)
          VALUES
            (1, 1, 1),
            (1, 6, 1),
            (1, 7, 1),
            (1, 9, 3),
            (1, 2, 1),
            (2, 4, 1),
            (2, 7, 1);
        `);
      });
    });
  });
  describe("e-commerce front-end routes", () => {
    describe("GET / - index/inventory page", () => {
      it("should return HTML for index page", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const { window } = new JSDOM(res.text);
        expect(getByText(window.document, /music shop🎸/i)).to.exist;
      });
      it("should show login link instead of cart count if not logged in", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        expect(document.querySelector("header").textContent.match(/cart/i)).to
          .be.null;
        expect(document.querySelector("header").textContent.match(/login/i)).to
          .exist;
      });
      it("should show cart count if logged in", async () => {
        const agent = request.agent(app);
        const loginResult = await agent
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(loginResult.headers["set-cookie"]).to.exist;
        const res = await agent.get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        const [[{ count }]] = await db.query(
          `SELECT SUM(quantity) AS count FROM cart WHERE user_id=1;`
        );
        const cart = getByText(
          document,
          new RegExp(`cart\\s+?\\(${count}\\)`, "i")
        );
        expect(cart).to.exist;
        expect(cart.href).to.eq("/cart");
      });
      it("should render names of items", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        for (const { name } of inventory) {
          const saleItems = document.getElementById("saleItems");
          const itemNameParagraph = getByText(
            saleItems,
            new RegExp(`^${name}$`, "i")
          );
          expect(itemNameParagraph).to.exist;
          expect(itemNameParagraph.tagName).to.eq("P");
        }
        expect(getByText(document, /music shop🎸/i)).to.exist;
      });
      it("should render descriptions of items", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        for (const { description } of inventory) {
          const saleItems = document.getElementById("saleItems");
          const itemNameParagraph = getByText(
            saleItems,
            new RegExp(`^${description}$`, "i")
          );
          expect(itemNameParagraph).to.exist;
          expect(itemNameParagraph.tagName).to.eq("P");
        }
        expect(getByText(document, /music shop🎸/i)).to.exist;
      });
      it("should render items for sale in link tags that lead to product page", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        for (const { name, id } of inventory) {
          const saleItems = document.getElementById("saleItems");
          const itemNameParagraph = getByText(
            saleItems,
            new RegExp(`^${name}$`, "i")
          );
          expect(itemNameParagraph).to.exist;
          expect(itemNameParagraph.tagName).to.eq("P");
          const itemContainer = itemNameParagraph.parentElement;
          expect(itemContainer.tagName).to.eq("A");
          expect(itemContainer.href).to.eq(`/product/${id}`);
        }
        expect(getByText(document, /music shop🎸/i)).to.exist;
      });
      it("should render price of items", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        for (const { name, price } of inventory) {
          const saleItems = document.getElementById("saleItems");
          const itemNameParagraph = getByText(
            saleItems,
            new RegExp(`^${name}$`, "i")
          );
          expect(itemNameParagraph).to.exist;
          expect(itemNameParagraph.tagName).to.eq("P");
          const itemContainer = itemNameParagraph.parentElement;
          expect(getByText(itemContainer, `$${price}`)).to.exist;
        }
        expect(getByText(document, /music shop🎸/i)).to.exist;
      });
      it("should render images of items", async () => {
        const res = await request(app).get("/");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        for (const { name, image } of inventory) {
          const saleItems = document.getElementById("saleItems");
          const itemNameParagraph = getByText(
            saleItems,
            new RegExp(`^${name}$`, "i")
          );
          expect(itemNameParagraph).to.exist;
          expect(itemNameParagraph.tagName).to.eq("P");
          const itemContainer = itemNameParagraph.parentElement;
          const imageEl = itemContainer.querySelector("img");
          expect(imageEl).to.exist;
          expect(imageEl.src).to.include(image);
        }
        expect(getByText(document, /music shop🎸/i)).to.exist;
      });
    });
    describe("GET /product/:id - product pages", () => {
      for (const { id, name, price, image, description } of inventory) {
        describe(`GET /product/${id} - product page for ${name}`, () => {
          it(`should return HTML`, async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
          });
          it("should show login link instead of cart count if not logged in", async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            expect(document.querySelector("header").textContent.match(/cart/i))
              .to.be.null;
            expect(document.querySelector("header").textContent.match(/login/i))
              .to.exist;
          });
          it("should show cart count if logged in", async () => {
            const agent = request.agent(app);
            const loginResult = await agent
              .post("/api/login")
              .send({ username: "user", password: "password123" });
            expect(loginResult.headers["set-cookie"]).to.exist;
            const res = await agent.get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const [[{ count }]] = await db.query(
              `SELECT SUM(quantity) AS count FROM cart WHERE user_id=1;`
            );
            const cart = getByText(
              document,
              new RegExp(`cart\\s+?\\(${count}\\)`, "i")
            );
            expect(cart).to.exist;
            expect(cart.href).to.eq("/cart");
          });
          for (let [key, value] of Object.entries({
            name,
            price,
            description,
          })) {
            value = key === "price" ? "\\$" + value : value;
            it(`should show ${key} (${value.replace("\\", "")})`, async () => {
              const res = await request(app).get(`/product/${id}`);
              expect(res.status).to.eq(200);
              expect(res.headers["content-type"]).to.include("html");
              const {
                window: { document },
              } = new JSDOM(res.text);
              expect(getByText(document, new RegExp(`^${value}$`, "i"))).to
                .exist;
            });
          }
          it(`should show image of product (images/${image})`, async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const img = document.querySelector("img");
            expect(img).to.exist;
            expect(img.src).to.eq(`/images/${image}`);
          });
          it(`should render a form that POSTs to /api/cart?inventoryId=${id}`, async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const form = document.querySelector("form");
            expect(form).to.exist;
            expect(form.method).to.match(/POST/i);
            expect(form.action).to.eq(`/api/cart?inventoryId=${id}`);
          });
          it(`should render an "add to cart" button inside form`, async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const form = document.querySelector("form");
            expect(form).to.exist;
            const btn = getByText(form, /add to cart/i);
            expect(btn).to.exist;
            expect(btn.type).to.not.eq("button");
          });
          it(`should render a quantity input of type number set to 1 inside form`, async () => {
            const res = await request(app).get(`/product/${id}`);
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const form = document.querySelector("form");
            expect(form).to.exist;
            const input = getByLabelText(form, /quantity/i);
            expect(input).to.exist;
            expect(input.type).to.eq("number");
            expect(input.value).to.eq("1");
          });
        });
      }
    });
    describe("GET /cart - cart page", () => {
      const agent = request.agent(app);
      before(async () => {
        const res = await agent
          .post("/api/login")
          .send({ username: "user", password: "password123" });
        expect(res.headers["set-cookie"]).to.exist;
      });
      it("should return HTML if logged in", async () => {
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
      });
      it('should render "Cart" heading', async () => {
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        expect(getByText(document, /^cart$/i)).to.exist;
      });
      it('should render "return to store" link', async () => {
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        const returnLink = getByText(document, /return to store/i);
        expect(returnLink).to.exist;
        expect(returnLink.href).to.eq("/");
      });
      it('should render "empty cart" button', async () => {
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        const emptyBtn = getByText(document, /empty cart/i);
        expect(emptyBtn).to.exist;
      });
      it("should render total", async () => {
        const res = await agent.get("/cart");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const {
          window: { document },
        } = new JSDOM(res.text);
        expect(getByText(document, "$" + cart.total)).to.exist;
      });
      for (const {
        name,
        image,
        quantity,
        inventoryQuantity,
        inventoryId,
        price,
        calculatedPrice,
      } of cart.cartItems) {
        describe(`Cart Item: ${name}`, () => {
          it(`should render name`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            expect(getByText(document, name)).to.exist;
          });
          it(`should render image`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const itemContainer = getByText(document, name).closest(
              ".cart-item"
            );
            expect(itemContainer.classList.contains("cart-item")).to.be.true;
            const img = itemContainer.querySelector("img");
            expect(img.src).to.eq("/images/" + image);
          });
          it(`should render price`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const nameEl = getByText(document, name);
            expect(getByText(nameEl.closest(".cart-item-info"), "$" + price)).to
              .exist;
          });
          it(`should render quantity`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const itemContainer = getByText(document, name).closest(
              ".cart-item"
            );
            const input = getByLabelText(itemContainer, /quantity/i);
            expect(input).to.exist;
            expect(input.value).to.eq(quantity.toString());
            expect(input.max).to.eq(inventoryQuantity.toString());
          });
          it(`should render calculatedPrice (quantity * price)`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const itemContainer = getByText(document, name).closest(
              ".cart-item"
            );
            expect(
              getByText(
                itemContainer.querySelector(".cart-item-subtotal"),
                "$" + calculatedPrice
              )
            ).to.exist;
          });
          it(`should render remove btn`, async () => {
            const res = await agent.get("/cart");
            expect(res.status).to.eq(200);
            expect(res.headers["content-type"]).to.include("html");
            const {
              window: { document },
            } = new JSDOM(res.text);
            const itemContainer = getByText(document, name).closest(
              ".cart-item"
            );
            const btn = itemContainer.querySelector(
              ".cart-item-subtotal button"
            );
            expect(btn).to.exist;
            expect(btn.textContent).to.match(/remove/i);
          });
        });
      }
    });
    describe("GET /login", () => {
      it("should return HTML for login page", async () => {
        const res = await request(app).get("/login");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const { window } = new JSDOM(res.text);
        expect(getByText(window.document, /music shop🎸/i)).to.exist;
      });
    });
    describe("GET /create-account", () => {
      it("should return HTML for sign up page", async () => {
        const res = await request(app).get("/login");
        expect(res.status).to.eq(200);
        expect(res.headers["content-type"]).to.include("html");
        const { window } = new JSDOM(res.text);
        expect(getByText(window.document, /music shop🎸/i)).to.exist;
      });
    });
  });
});
