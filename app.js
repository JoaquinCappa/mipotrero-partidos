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
window.login = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.register = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};

window.logout = () => {
  signOut(auth).then(() => location.reload());
};

// Detectar cambios en el estado de autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    mostrarContenido();
  }
});

// Mostrar contenido tras login
function mostrarContenido() {
  document.getElementById("login").style.display = "none";
  document.getElementById("explorar").style.display = "block";
  cargarPartidos();
  cargarMisPartidos();
}

// Cambiar de sección
window.showSection = (id) => {
  ["explorar", "crear", "mios"].forEach(sec => {
    document.getElementById(sec).style.display = sec === id ? "block" : "none";
  });
};

// Crear partido
window.crearPartido = async () => {
  const lugar = document.getElementById("lugar").value;
  const fecha = document.getElementById("fecha").value;
  const cupos = parseInt(document.getElementById("cupos").value);
  const descripcion = document.getElementById("descripcion").value;
  const creador = auth.currentUser.email;

  if (!lugar || !fecha || !cupos || !descripcion) {
    alert("Completa todos los campos");
    return;
  }

  const partido = {
    lugar,
    fecha,
    cupos,
    descripcion,
    creador,
    jugadores: [creador]
  };

  try {
    await addDoc(collection(db, "partidos"), partido);
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  } catch (error) {
    alert("Error creando partido: " + error.message);
  }
};

// Cargar partidos disponibles
async function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";
  const snapshot = await getDocs(collection(db, "partidos"));

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
}

// Cargar partidos donde participa el usuario
async function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";

  const q = query(collection(db, "partidos"), where("jugadores", "array-contains", auth.currentUser.email));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const p = docSnap.data();
    const div = document.createElement("div");
    div.className = "partido";
    div.innerHTML = `<strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}`;
    cont.appendChild(div);
  });
}

// Unirse a un partido
async function unirseAPartido(id, partido) {
  if (partido.jugadores.length >= partido.cupos) {
    alert("El partido ya está lleno");
    return;
  }

  partido.jugadores.push(auth.currentUser.email);

  try {
    await updateDoc(doc(db, "partidos", id), { jugadores: partido.jugadores });
    alert("Te uniste al partido");
    cargarPartidos();
    cargarMisPartidos();
  } catch (error) {
    alert("Error al unirse: " + error.message);
  }
}
