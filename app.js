// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, // ← ESTE ES EL QUE FALTABA
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


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
const partidosCol = collection(db, "partidos");
const partidosSnapshot = await getDocs(partidosCol);

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
  const email2 = document.getElementById("email").value;
  const password2 = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch(err => alert("Error: " + err.message));
};
function mostrarLogin() {
  document.getElementById('login').style.display = 'block';
  document.getElementById('explorar').style.display = 'none';
  document.getElementById('crear').style.display = 'none';
  document.getElementById('mios').style.display = 'none';
}



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
onAuthStateChanged(auth, (user) => {
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
window.function crearPartido() {
  const lugar = document.getElementById("lugar").value;
  const fechaInput = document.getElementById("fecha").value;
  const cupos = parseInt(document.getElementById("cupos").value);
  const descripcion = document.getElementById("descripcion").value;

  const fecha = new Date(fechaInput);
  const hoy = new Date();
  const maxFecha = new Date();
  maxFecha.setDate(hoy.getDate() + 30); // Máximo 30 días en el futuro

  // Validaciones
  if (fecha < hoy) {
    alert("No podés crear partidos en fechas pasadas.");
    return;
  }

  if (fecha > maxFecha) {
    alert("No podés crear partidos con más de 30 días de anticipación.");
    return;
  }

  const partido = {
    lugar,
    fecha: fecha.toISOString(), // guardamos en formato ISO
    cupos,
    descripcion,
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email]
  };

  db.collection("partidos").add(partido).then(() => {
    alert("Partido creado!");
    showSection("explorar");
    cargarPartidos();
  }).catch(error => {
    alert("Error al crear partido: " + error.message);
  });
}



// Cargar partidos disponibles
function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  lista.innerHTML = "";

  const hoy = new Date();

  db.collection("partidos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const p = doc.data();
      const fechaPartido = new Date(p.fecha);

      if (fechaPartido < hoy) return; // 🔥 Saltar si ya pasó

      const div = document.createElement("div");
      div.className = "partido";
      div.innerHTML = `
        <strong>${p.fecha}</strong> - ${p.lugar}<br>${p.descripcion}<br>
        ${p.jugadores.length} / ${p.cupos} jugadores<br>
      `;

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
mostrarLogin();
