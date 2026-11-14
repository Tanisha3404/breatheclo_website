// BreatheClo authentication (Firebase Auth). Loaded on every page as a module so the header knows who is logged in.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyA4lfa7O0WF6F4VNe4GSupqLw9MvxtN-CM",
  authDomain: "breathecloauth.firebaseapp.com",
  projectId: "breathecloauth",
  storageBucket: "breathecloauth.firebasestorage.app",
  messagingSenderId: "625455102501",
  appId: "1:625455102501:web:a637682132acc15f675dcc",
  measurementId: "G-SXHW51GBFL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const BC = window.BC;

/* keep the header in sync with the Firebase session */
onAuthStateChanged(auth, (user) => {
  BC.getIdToken = user ? () => user.getIdToken() : null;   // set first: used to call the backend
  BC.setUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null);
});
BC.logout = async () => {
  await signOut(auth);
  BC.toast("You have been logged out.");
  if (/account|checkout/.test(location.pathname)) location.href = "index.html";
};

const MESSAGES = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again."
};
const friendly = (e) => MESSAGES[e.code] || "Something went wrong. Please try again.";

// only allow redirects to pages of this site (e.g. login.html?next=checkout.html)
function nextUrl(fallback) {
  const n = new URLSearchParams(location.search).get("next");
  return n && /^[a-z0-9_-]+\.html(\?[\w=&%-]*)?$/i.test(n) ? n : fallback;
}

function busy(btn, on, label) { btn.disabled = on; btn.textContent = on ? "PLEASE WAIT..." : label; }

function handle(form, run) {
  if (!form) return;
  form.setAttribute("novalidate", "");
  const btn = form.querySelector("button[type=submit]");
  const label = btn.textContent;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    busy(btn, true, label);
    try { await run(); }
    catch (err) { BC.toast(friendly(err), "error"); }
    finally { busy(btn, false, label); }
  });
}
const val = (id) => document.getElementById(id).value.trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const page = location.pathname.split("/").pop();
const pageForm = () => document.querySelector("form:not(.search-bar):not(#bc-subscribe)");

if (page === "login.html") {
  handle(pageForm(), async () => {
    if (!EMAIL.test(val("email"))) throw { code: "auth/invalid-email" };
    await signInWithEmailAndPassword(auth, val("email"), document.getElementById("pwd").value);
    BC.toast("Logged in successfully.");
    setTimeout(() => (location.href = nextUrl("index.html")), 600);
  });
  const next = new URLSearchParams(location.search).get("next");
  const create = document.getElementById("create");
  if (next && create) create.href = "signin.html?next=" + encodeURIComponent(next);
}

if (page === "signin.html") {
  handle(pageForm(), async () => {
    const fname = val("fname"), lname = val("lname");
    if (!fname) { BC.toast("Please enter your first name.", "error"); return; }
    if (!EMAIL.test(val("email"))) throw { code: "auth/invalid-email" };
    const pwd = document.getElementById("pwd").value;
    if (pwd.length < 6) throw { code: "auth/weak-password" };
    const cred = await createUserWithEmailAndPassword(auth, val("email"), pwd);
    const displayName = `${fname} ${lname}`.trim();
    await updateProfile(cred.user, { displayName });
    BC.setUser({ uid: cred.user.uid, email: cred.user.email, displayName });
    BC.toast("Account created. Welcome to BreatheClo!");
    setTimeout(() => (location.href = nextUrl("index.html")), 800);
  });
}

if (page === "forgot.html") {
  handle(pageForm(), async () => {
    if (!EMAIL.test(val("email"))) throw { code: "auth/invalid-email" };
    await sendPasswordResetEmail(auth, val("email"));
    BC.toast("Password reset email sent. Check your inbox.");
  });
}
