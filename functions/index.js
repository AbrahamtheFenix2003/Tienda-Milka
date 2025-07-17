// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const fs = require("fs");

// Inicializa Firebase Admin para poder acceder a Firestore desde el servidor
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Esta es la ruta principal que manejará las páginas de producto
app.get("/producto/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    // 1. Obtener los datos del producto desde Firestore
    const doc = await db.collection("products").doc(productId).get();
    if (!doc.exists) {
      res.status(404).send("Producto no encontrado");
      return;
    }
    const product = doc.data();

    // 2. Leer nuestro archivo de plantilla HTML
    // Usamos 'fs' (File System) para leer el archivo
    let htmlTemplate = fs.readFileSync("./producto-template.html", "utf8");

    // 3. Reemplazar los placeholders con los datos reales del producto
    htmlTemplate = htmlTemplate.replace(/__OG_TITLE__/g, product.name || "Producto");
    htmlTemplate = htmlTemplate.replace(/__OG_DESCRIPTION__/g, product.description || "Descubre este producto en BRAHOLET Importaciones.");
    htmlTemplate = htmlTemplate.replace(/__OG_IMAGE__/g, product.imageUrl || "https://braholet-importaciones.web.app/logo.png");
    htmlTemplate = htmlTemplate.replace(/__OG_URL__/g, `https://braholet-importaciones.web.app/producto/${productId}`);

    // 4. Enviar el HTML final como respuesta
    res.status(200).send(htmlTemplate);

  } catch (error) {
    console.error("Error al generar la página del producto:", error);
    res.status(500).send("Ocurrió un error en el servidor.");
  }
});

// Exportamos la app de Express para que Firebase la use como una Cloud Function
exports.ssr = functions.https.onRequest(app);