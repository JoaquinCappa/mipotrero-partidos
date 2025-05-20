// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyACVghZ9he6Wcf-nA-Vn35VIPxPOkhoIok",
  authDomain: "mi-potrero.firebaseapp.com",
  projectId: "mi-potrero",
  storageBucket: "mi-potrero.appspot.com",
  messagingSenderId: "36934575528",
  appId: "1:36934575528:web:686fa0df3310caa494299d",
  measurementId: "G-MJ31HJ401D"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const partidosCol = collection(db, "partidos");
// Registro
window.login = function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password || password.length < 6 || !email.includes("@") || !email.includes(".")) {
    alert("Completá los campos correctamente.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch((e) => {
      switch (e.code) {
        case 'auth/invalid-email':
          alert("Email inválido.");
          break;
        case 'auth/user-not-found':
          alert("Usuario no encontrado.");
          break;
        case 'auth/wrong-password':
          alert("Contraseña incorrecta.");
          break;
        default:
          alert("Error: " + e.message);
      }
    });
};

window.register = function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password || password.length < 6 || !email.includes("@") || !email.includes(".")) {
    alert("Completá los campos correctamente.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => mostrarContenido())
    .catch((e) => {
      switch (e.code) {
        case 'auth/email-already-in-use':
          alert("Ese email ya está registrado. Iniciá sesión en lugar de registrarte.");
          break;
        case 'auth/invalid-email':
          alert("Email inválido.");
          break;
        case 'auth/weak-password':
          alert("Contraseña débil.");
          break;
        default:
          alert("Error: " + e.message);
      }
    });
};


// Mostrar login
window.mostrarLogin = function() {
  const login = document.getElementById('login');
  if (login) login.style.display = 'block';

  ["explorar", "crear", "mios"].forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = 'none';
  });
};

// Logout
window.logout = function() {
  signOut(auth).then(() => {
    mostrarLogin();
  });
};

// Mostrar secciones
window.showSection = function(id) {
  ["explorar", "crear", "mios"].forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = sec === id ? "block" : "none";
  });
};

// Estado de sesión
onAuthStateChanged(auth, user => {
  console.log("Estado de sesión cambiado:", user);
  if (user) {
    mostrarContenido();
  } else {
    mostrarLogin();
  }
});

// Mostrar contenido principal tras login
function mostrarContenido() {
  document.getElementById("login").style.display = "none";
  showSection("explorar");
  cargarPartidos();
  cargarMisPartidos();
}

// Crear partido
window.crearPartido = function() {
  const lugar = document.getElementById("lugar").value.trim();
  const fechaInput = document.getElementById("fecha").value;
  const cupos = parseInt(document.getElementById("cupos").value);
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!lugar || !fechaInput || isNaN(cupos) || cupos < 1) {
    alert("Por favor completa todos los campos correctamente");
    return;
  }

  const fecha = new Date(fechaInput);
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const maxFecha = new Date();
  maxFecha.setDate(hoy.getDate() + 30);

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
    fecha: fecha.toISOString(),
    cupos,
    descripcion,
    creador: auth.currentUser.email,
    jugadores: [auth.currentUser.email]
  };

  addDoc(partidosCol, partido)
    .then(() => {
      alert("Partido creado!");
      showSection("explorar");
      cargarPartidos();
    })
    .catch(e => alert("Error al crear partido: " + e.message));
};
// Cargar partidos disponibles
function cargarPartidos() {
  const lista = document.getElementById("lista-partidos");
  if (!lista) {
    console.error("No existe el contenedor 'lista-partidos'");
    return;
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  getDocs(partidosCol)
    .then(snapshot => {
      snapshot.forEach(doc => {
        const p = doc.data();
        const fechaPartido = new Date(p.fecha);
        if (fechaPartido < hoy) return;

        const div = document.createElement("div");
        div.className = "partido";
        const fechaFormateada = fechaPartido.toLocaleString();
        div.innerHTML = `<strong>${fechaFormateada}</strong> - ${p.lugar}<br>${p.descripcion}<br>${p.jugadores.length} / ${p.cupos} jugadores<br>`;
        if (!p.jugadores.includes(auth.currentUser.email)) {
          const btn = document.createElement("button");
          btn.textContent = "Unirse";
          btn.onclick = () => unirseAPartido(doc.id, p);
          div.appendChild(btn);
        }
        lista.appendChild(div);
      });
    })
    .catch(e => console.error("Error al obtener partidos:", e));
  }
// Cargar mis partidos
function cargarMisPartidos() {
  const cont = document.getElementById("mis-partidos");
  cont.innerHTML = "";
  const q = query(partidosCol, where("jugadores", "array-contains", auth.currentUser.email));
  getDocs(q)
    .then(snapshot => {
      snapshot.forEach(doc => {
        const p = doc.data();
        const div = document.createElement("div");
        const fechaFormateada = new Date(p.fecha).toLocaleString();
        div.className = "partido";
        div.innerHTML = `<strong>${fechaFormateada}</strong> - ${p.lugar}<br>${p.descripcion}`;
        cont.appendChild(div);
      });
    }) // ← cierre de .then
    .catch(error => console.error("Error al cargar mis partidos:", error)); // Manejo de errores opcional
} // ← cierre de la función


// Unirse a un partido
window.unirseAPartido = function(id, partido) {
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
};
