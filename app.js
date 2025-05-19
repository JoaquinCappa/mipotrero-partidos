// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey:    "AIzaSyACVghZ9he6Wcf-nA-Vn35VIPxPOkhoIok",
  authDomain:"mi-potrero.firebaseapp.com",
  projectId: "mi-potrero",
  storageBucket: "mi-potrero.firebasestorage.app",
  messagingSenderId: "36934575528",
  appId:     "1:36934575528:web:686fa0df3310caa494299d",
  measurementId: "G-MJ31HJ401D",
};

// Inicialización
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);

// --- Autenticación ---

export async function login() {
  const email = document.getElementById("email").value;
  const pass  = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    mostrarContenido();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

export async function register() {
  const email = document.getElementById("email").value;
  const pass  = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    mostrarContenido();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

export async function logout() {
  await signOut(auth);
  location.reload();
}

onAuthStateChanged(auth, user => {
  if (user) {
    mostrarContenido();
  } else {
    document.getElementById("login").style.display = "block";
    ["explorar","crear","mios"].forEach(s =>
      document.getElementById(s).style.display = "none"
    );
  }
});

// --- UI y Firestore ---

function mostrarContenido() {
  document.getElementById("login").style.display    = "none";
  document.getElementById("explorar").style.display = "block";
  cargarPartidos();
  cargarMisPartidos();
}

export function showSection(id) {
  ["explorar","crear","mios"].forEach(sec =>
    document.getElementById(sec).style.display = sec === id ? "block" : "none"
  );
}

export async function crearPartido() {
  const partido = {
    lugar:       document.getElementById("lugar").value,
    fecha:       document.getElementById("fecha").value,
    cupos:       parseInt(document.getElementById("cupos").value),
    descripcion: document.getElementById("descripcion").value,
    creador:     auth.currentUser.email,
    jugadores:   [auth.currentUser.email]
  };
  try {
    await addDoc(collection(db, "partidos"), partido);
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  } catch (e) {
    alert("Error creando partido: " + e.message);
  }
}

export async function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";
  try {
    const snap = await getDocs(collection(db, "partidos"));
    snap.forEach(d => {
      const p = d.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>
                       ${p.descripcion}<br>
                       ${p.jugadores.length} / ${p.cupos} jugadores<br>`;
      if (!p.jugadores.includes(auth.currentUser.email)) {
        const btn = document.createElement("button");
        btn.textContent = "Unirse";
        btn.onclick = () => unirseAPartido(d.id, p);
        div.appendChild(btn);
      }
      lista.appendChild(div);
    });
  } catch (e) {
    alert("Error cargando partidos: " + e.message);
  }
}

export async function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";
  try {
    const q    = query(collection(db, "partidos"), where("jugadores", "array-contains", auth.currentUser.email));
    const snap = await getDocs(q);
    snap.forEach(d => {
      const p = d.data();
      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}`;
      cont.appendChild(div);
    });
  } catch (e) {
    alert("Error cargando mis partidos: " + e.message);
  }
}

export async function unirseAPartido(id, partido) {
  if (partido.jugadores.length >= partido.cupos) {
    alert("El partido ya está lleno");
    return;
  }
  partido.jugadores.push(auth.currentUser.email);
  const ref = doc(db, "partidos", id);
  try {
    await updateDoc(ref, { jugadores: partido.jugadores });
    alert("Te uniste al partido");
    cargarPartidos();
    cargarMisPartidos();
  } catch (e) {
    alert("Error al unirse: " + e.message);
  }
  window.login = login;
    window.register = register;
    window.logout = logout;
    window.showSection = showSection;
    window.crearPartido = crearPartido;

}
