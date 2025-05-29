import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config (ganti dengan config Firebase kamu sendiri)
const firebaseConfig = {
  apiKey: "AIzaSyDCxWbuScND_kc4oS_WZN7s4q6CmNooNpg",
  authDomain: "digital-scoring-porseni.firebaseapp.com",
  projectId: "digital-scoring-porseni",
  storageBucket: "digital-scoring-porseni.firebasestorage.app",
  messagingSenderId: "673985819962",
  appId: "1:673985819962:web:e985d20a4d5d478df58c03",
  measurementId: "G-WHEDBKX2R3"
};

// Inisialisasi Firebase dan Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data kriteria tiap lomba
const kriteriaMap = {
  tari: {
    teknik: 30,
    ekspresi: 40,
    kostum: 30,
  },
  futsal: {
    skill: 25,
    strategi: 25,
    kerjasama: 25,
    fairplay: 25,
  }
};

// Ambil elemen-elemen penting
const selectLomba = document.getElementById("selectLomba");
const formKriteria = document.getElementById("formKriteria");
const btnSimpan = document.getElementById("btnSimpan");

// Tampilkan form kriteria saat load dan saat lomba berubah
selectLomba.addEventListener("change", tampilkanKriteria);
window.addEventListener("load", tampilkanKriteria);

// Event listener tombol simpan
btnSimpan.addEventListener("click", submitNilai);

function tampilkanKriteria() {
  const lomba = selectLomba.value;
  const kriteria = kriteriaMap[lomba];
  formKriteria.innerHTML = "";

  for (const [key, bobot] of Object.entries(kriteria)) {
    formKriteria.innerHTML += `
      <label for="kriteria-${key}">${key} (${bobot}%)</label>
      <input type="number" id="kriteria-${key}" min="0" max="100" value="0" />
    `;
  }
}

async function submitNilai() {
  alert("submitNilai dipanggil!"); // Debug: pastikan fungsi jalan

  const lomba = selectLomba.value;
  const peserta = document.getElementById("selectPeserta").value;
  const kriteria = kriteriaMap[lomba];

  let nilai = {};
  let total = 0;

  for (const key of Object.keys(kriteria)) {
    const val = parseFloat(document.getElementById(`kriteria-${key}`).value) || 0;
    nilai[key] = val;
    total += val * (kriteria[key] / 100);
  }

  const juriID = "juri1"; // bisa diubah dinamis jika mau

  try {
    await setDoc(doc(db, "nilai", `${lomba}_${peserta}_${juriID}`), {
      lomba,
      peserta,
      juri: juriID,
      nilai,
      total
    });
    alert("✅ Nilai berhasil disimpan!");
  } catch (error) {
    console.error("Error simpan nilai:", error);
    alert("❌ Gagal simpan nilai. Cek console browser.");
  }
}
