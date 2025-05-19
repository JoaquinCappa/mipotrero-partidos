// app.js (modo módulo)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Configuración de Firebase (tuya)
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Funciones

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    mostrarContenido();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    mostrarContenido();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function logout() {
  signOut(auth).then(() => location.reload());
}

function mostrarContenido() {
  document.getElementById("login").style.display = "none";
  document.getElementById("explorar").style.display = "block";
  cargarPartidos();
  cargarMisPartidos();
}

function showSection(id) {
  ["explorar", "crear", "mios"].forEach((sec) => {
    document.getElementById(sec).style.display = sec === id ? "block" : "none";
  });
}

async function crearPartido() {
  const lugar = document.getElementById("lugar").value.trim();
  const fecha = document.getElementById("fecha").value;
  const cupos = parseInt(document.getElementById("cupos").value);
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!lugar || !fecha || !cupos || !descripcion) {
    alert("Por favor completa todos los campos");
    return;
  }

  const partido = {
    lugar,
    fecha,
    cupos,
    descripcion,
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email],
  };

  try {
    await addDoc(collection(db, "partidos"), partido);
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  } catch (error) {
    alert("Error al guardar partido: " + error.message);
  }
}

async function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";
  try {
    const querySnapshot = await getDocs(collection(db, "partidos"));
    querySnapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}<br>
        ${p.jugadores.length} / ${p.cupos} jugadores<br>`;
      if (!p.jugadores.includes(auth.currentUser.email)) {
        const btn = document.createElement("button");
        btn.textContent = "Unirse";
        btn.onclick = () => unirseAPartido(docSnap.id, p);
        div.appendChild(btn);
      }
      lista.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar partidos:", error);
  }
}

async function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";
  try {
    const q = query(
      collection(db, "partidos"),
      where("jugadores", "array-contains", auth.currentUser.email)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}`;
      cont.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar mis partidos:", error);
  }
}

async function unirseAPartido(id, partido) {
  if (partido.jugadores.length >= partido.cupos) {
    alert("El partido ya está lleno");
    return;
  }
  try {
    partido.jugadores.push(auth.currentUser.email);
    const partidoRef = doc(db, "partidos", id);
    await updateDoc(partidoRef, { jugadores: partido.jugadores });
    alert("Te uniste al partido");
    cargarPartidos();
    cargarMisPartidos();
  } catch (error) {
    alert("Error al unirse al partido: " + error.message);
  }
}

// Detectar cambios de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) mostrarContenido();
});

// Exponer funciones al scope global para que el HTML pueda llamarlas
window.showSection = showSection;
window.login = login;
window.logout = logout;
window.register = register;
window.crearPartido = crearPartido;

