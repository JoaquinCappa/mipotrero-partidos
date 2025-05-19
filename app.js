// Importaciones Firebase modular v11
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Config Firebase
// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACVghZ9he6Wcf-nA-Vn35VIPxPOkhoIok",
  authDomain: "mi-potrero.firebaseapp.com",
  projectId: "mi-potrero",
  storageBucket: "mi-potrero.firebasestorage.app",
  messagingSenderId: "36934575528",
  appId: "1:36934575528:web:686fa0df3310caa494299d",
  measurementId: "G-MJ31HJ401D",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Funciones para mostrar secciones
function showSection(id) {
  ["explorar", "crear", "mios", "login"].forEach(sec => {
    document.getElementById(sec).style.display = sec === id ? "block" : "none";
  });
}

// Manejo de login
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  auth.signInWithEmailAndPassword(email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
}

// Manejo de registro
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
}

// Logout
function logout() {
  auth.signOut().then(() => {
    showSection("login");
  });
}

// Mostrar contenido cuando el usuario está logueado
function mostrarContenido() {
  showSection("explorar");
  cargarPartidos();
  cargarMisPartidos();
}

// Crear partido
function crearPartido() {
  const partido = {
    lugar: document.getElementById("lugar").value.trim(),
    fecha: document.getElementById("fecha").value,
    cupos: parseInt(document.getElementById("cupos").value),
    descripcion: document.getElementById("descripcion").value.trim(),
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email]
  };

  if (!partido.lugar || !partido.fecha || !partido.cupos || !partido.descripcion) {
    alert("Por favor completa todos los campos");
    return;
  }

  db.collection("partidos").add(partido)
    .then(() => {
      alert("Partido creado!");
      showSection("explorar");
      cargarPartidos();
    })
    .catch(err => alert("Error al crear partido: " + err.message));
}

// Cargar partidos disponibles
function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";
  db.collection("partidos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const p = doc.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}<br>
        ${p.jugadores.length} / ${p.cupos} jugadores<br>`;

      if (!p.jugadores.includes(auth.currentUser.email)) {
        const btn = document.createElement("button");
        btn.textContent = "Unirse";
        btn.onclick = () => unirseAPartido(doc.id, p);
        div.appendChild(btn);
      }
      lista.appendChild(div);
    });
  });
}

// Cargar partidos donde está el usuario
function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";
  db.collection("partidos").where("jugadores", "array-contains", auth.currentUser.email).get().then(snapshot => {
    snapshot.forEach(doc => {
      const p = doc.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}`;
      cont.appendChild(div);
    });
  });
}

// Unirse a un partido
function unirseAPartido(id, partido) {
  if (partido.jugadores.length >= partido.cupos) {
    alert("El partido ya está lleno");
    return;
  }
  partido.jugadores.push(auth.currentUser.email);
  db.collection("partidos").doc(id).update({ jugadores: partido.jugadores }).then(() => {
    alert("Te uniste al partido");
    cargarPartidos();
    cargarMisPartidos();
  });
}

// Eventos al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  // Botones menú
  document.getElementById("btnExplorar").addEventListener("click", () => showSection("explorar"));
  document.getElementById("btnCrear").addEventListener("click", () => showSection("crear"));
  document.getElementById("btnMios").addEventListener("click", () => showSection("mios"));
  document.getElementById("btnLogout").addEventListener("click", logout);

  // Botones login / registro
  document.getElementById("btnLogin").addEventListener("click", login);
  document.getElementById("btnRegister").addEventListener("click", register);

  // Botón crear partido
  document.getElementById("btnCrearPartido").addEventListener("click", crearPartido);

  // Detectar estado de autenticación
  auth.onAuthStateChanged(user => {
    if (user) {
      mostrarContenido();
    } else {
      showSection("login");
    }
  });
});

