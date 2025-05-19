// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, // ← ESTA LÍNEA ES LA IMPORTANTE
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACVghZ9he6Wcf-nA-Vn35VIPxPOkhoIok",
  authDomain: "mi-potrero.firebaseapp.com",
  projectId: "mi-potrero",
  storageBucket: "mi-potrero.appspot.com",
  messagingSenderId: "36934575528",
  appId: "1:36934575528:web:686fa0df3310caa494299d",
  measurementId: "G-MJ31HJ401D"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Funciones de login, registro y logout
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.register = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.logout = function () {
  signOut(auth).then(() => location.reload());
};

// Mostrar secciones
window.showSection = function (id) {
  ["explorar", "crear", "mios"].forEach(sec => {
    document.getElementById(sec).style.display = sec === id ? "block" : "none";
  });
};

// Estado de sesión
onAuthStateChanged(auth, user => {
  if (user) {
    mostrarContenido();
  }
});

// Mostrar contenido principal
function mostrarContenido() {
  document.getElementById("login").style.display = "none";
  document.getElementById("explorar").style.display = "block";
  cargarPartidos();
  cargarMisPartidos();
}

// Crear partido
window.crearPartido = function () {
  const partido = {
    lugar: document.getElementById("lugar").value,
    fecha: document.getElementById("fecha").value,
    cupos: parseInt(document.getElementById("cupos").value),
    descripcion: document.getElementById("descripcion").value,
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email]
  };
  addDoc(collection(db, "partidos"), partido).then(() => {
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  });
};

// Cargar partidos disponibles
function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";
  getDocs(collection(db, "partidos")).then(snapshot => {
    snapshot.forEach(docSnap => {
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
  });
}

// Cargar mis partidos
function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";
  const partidosRef = collection(db, "partidos");
  const q = query(partidosRef, where("jugadores", "array-contains", auth.currentUser.email));
  getDocs(q).then(snapshot => {
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
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
  const docRef = doc(db, "partidos", id);
  updateDoc(docRef, { jugadores: partido.jugadores }).then(() => {
    alert("Te uniste al partido");
    cargarPartidos();
    cargarMisPartidos();
  });
}

