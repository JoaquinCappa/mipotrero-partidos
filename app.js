// Importaciones Firebase modular v11
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyACVghZ9he6Wcf-nA-Vn35VIPxPOkhoIok",
  authDomain: "mi-potrero.firebaseapp.com",
  projectId: "mi-potrero",
  storageBucket: "mi-potrero.firebasestorage.app",
  messagingSenderId: "36934575528",
  appId: "1:36934575528:web:686fa0df3310caa494299d",
  measurementId: "G-MJ31HJ401D",
};

// Inicializo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Funciones de autenticación
// Asumo que ya importaste y configuraste Firebase antes

window.showSection = function(id) {
  ["explorar", "crear", "mios"].forEach(sec => {
    document.getElementById(sec).style.display = sec === id ? "block" : "none";
  });
};

window.login = function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.register = function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.logout = function() {
  auth.signOut().then(() => location.reload());
};

function mostrarContenido() {
  document.getElementById("login").style.display = "none";
  document.getElementById("explorar").style.display = "block";
  cargarPartidos();
  cargarMisPartidos();
}

window.crearPartido = function() {
  const partido = {
    lugar: document.getElementById("lugar").value,
    fecha: document.getElementById("fecha").value,
    cupos: parseInt(document.getElementById("cupos").value),
    descripcion: document.getElementById("descripcion").value,
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email]
  };
  db.collection("partidos").add(partido).then(() => {
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  });
};

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

auth.onAuthStateChanged(user => {
  if (user) mostrarContenido();
});
