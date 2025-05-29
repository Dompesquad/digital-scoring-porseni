// Firebase config (ganti dengan milikmu)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCxWbuScND_kc4oS_WZN7s4q6CmNooNpg",
  authDomain: "digital-scoring-porseni.firebaseapp.com",
  projectId: "digital-scoring-porseni",
  storageBucket: "digital-scoring-porseni.appspot.com",
  messagingSenderId: "673985819962",
  appId: "1:673985819962:web:e985d20a4d5d478df58c03",
  measurementId: "G-WHEDBKX2R3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simpan Nilai
document.getElementById("formNilai").addEventListener("submit", async (e) => {
  e.preventDefault();

  const peserta = document.getElementById("inputPeserta").value.trim();
  const lomba = document.getElementById("selectLomba").value;
  const juri = document.getElementById("inputJuri").value.trim();
  const nilai1 = parseFloat(document.getElementById("nilai1").value);
  const nilai2 = parseFloat(document.getElementById("nilai2").value);
  const nilai3 = parseFloat(document.getElementById("nilai3").value);

  if (!peserta || !lomba || !juri || isNaN(nilai1) || isNaN(nilai2) || isNaN(nilai3)) {
    alert("Harap isi semua data dengan benar!");
    return;
  }

  const total = ((nilai1 + nilai2 + nilai3) / 3).toFixed(2);

  try {
    await addDoc(collection(db, "nilai"), {
      peserta,
      lomba,
      juri,
      nilai1,
      nilai2,
      nilai3,
      total: parseFloat(total),
      timestamp: new Date()
    });
    alert("Nilai berhasil disimpan!");
    document.getElementById("formNilai").reset();
    // Perbarui daftar nilai sesuai lomba yang dipilih di daftar
    const lombaDaftar = document.getElementById("selectLombaDaftar").value;
    if (lombaDaftar === lomba) {
      tampilkanDaftarNilai();
    }
  } catch (error) {
    console.error("Gagal simpan nilai:", error);
    alert("Gagal simpan nilai. Cek console browser untuk detail error.");
  }
});

// Tampilkan daftar nilai berdasarkan filter lomba (urutan rata-rata tertinggi ke rendah)
async function tampilkanDaftarNilai() {
  const daftarDiv = document.getElementById("daftarNilai");
  daftarDiv.innerHTML = "<em>Memuat data...</em>";

  const lomba = document.getElementById("selectLombaDaftar").value;
  if (!lomba) {
    daftarDiv.innerHTML = "<p>Silakan pilih lomba terlebih dahulu.</p>";
    return;
  }

  const nilaiRef = collection(db, "nilai");
  const q = query(nilaiRef, where("lomba", "==", lomba));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    daftarDiv.innerHTML = "<p>Belum ada nilai untuk lomba ini.</p>";
    return;
  }

  // Kelompokkan nilai per peserta
  const data = {};
  snapshot.forEach(doc => {
    const d = doc.data();
    if (!data[d.peserta]) data[d.peserta] = [];
    data[d.peserta].push({ juri: d.juri, total: d.total });
  });

  // Hitung rata-rata dan urutkan peserta
  const hasil = Object.entries(data).map(([peserta, penilaian]) => {
    const rata = penilaian.reduce((s, p) => s + p.total, 0) / penilaian.length;
    return { peserta, penilaian, rata };
  }).sort((a, b) => b.rata - a.rata);

  daftarDiv.innerHTML = hasil.map((d, i) => `
    <div class="card-nilai">
      <strong>${i + 1}. ${d.peserta}</strong><br/>
      Rata-rata: <strong>${d.rata.toFixed(2)}</strong>
      <ul>
        ${d.penilaian.map(p => `<li>${p.juri}: ${p.total.toFixed(2)}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

// Update daftar nilai saat dropdown lomba daftar diubah
document.getElementById("selectLombaDaftar").addEventListener("change", tampilkanDaftarNilai);

// Export ke Excel semua nilai lomba terpilih
document.getElementById("btnExportExcel").addEventListener("click", exportKeExcel);

// Export nilai per juri untuk lomba terpilih
document.getElementById("btnExportJuri").addEventListener("click", exportPerJuri);

// Export semua lomba sekaligus
document.getElementById("btnExportSemua").addEventListener("click", exportSemuaLomba);

// Fungsi export semua peserta & nilai untuk lomba terpilih
async function exportKeExcel() {
  const lomba = document.getElementById("selectLombaDaftar").value;
  if (!lomba) {
    alert("Silakan pilih lomba untuk export.");
    return;
  }

  const nilaiRef = collection(db, "nilai");
  const q = query(nilaiRef, where("lomba", "==", lomba));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("Tidak ada data untuk lomba ini.");
    return;
  }

  // Siapkan data sheet
  const rows = [["Peserta", "Juri", "Nilai 1", "Nilai 2", "Nilai 3", "Total"]];
  snapshot.forEach(doc => {
    const d = doc.data();
    rows.push([d.peserta, d.juri, d.nilai1, d.nilai2, d.nilai3, d.total]);
  });

  downloadExcel(rows, `nilai_${lomba.replaceAll(" ", "_")}.xlsx`);
}

// Export nilai per juri untuk lomba terpilih dan filter juri optional
async function exportPerJuri() {
  const lomba = document.getElementById("selectLombaDaftar").value;
  const juriFilter = document.getElementById("inputJuriFilter").value.trim().toLowerCase();

  if (!lomba) {
    alert("Silakan pilih lomba untuk export.");
    return;
  }

  const nilaiRef = collection(db, "nilai");
  const q = query(nilaiRef, where("lomba", "==", lomba));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    alert("Tidak ada data untuk lomba ini.");
    return;
  }

  const rows = [["Peserta", "Juri", "Nilai 1", "Nilai 2", "Nilai 3", "Total"]];
  let adaData = false;

  snapshot.forEach(doc => {
    const d = doc.data();
    if (juriFilter === "" || d.juri.toLowerCase() === juriFilter) {
      rows.push([d.peserta, d.juri, d.nilai1, d.nilai2, d.nilai3, d.total]);
      adaData = true;
    }
  });

  if (!adaData) {
    alert("Tidak ada data untuk juri yang dipilih.");
    return;
  }

  downloadExcel(rows, `nilai_${lomba.replaceAll(" ", "_")}_juri_${juriFilter || "semua"}.xlsx`);
}

// Export semua nilai dari semua lomba
async function exportSemuaLomba() {
  const nilaiRef = collection(db, "nilai");
  const snapshot = await getDocs(nilaiRef);

  if (snapshot.empty) {
    alert("Belum ada data nilai.");
    return;
  }

  const rows = [["Lomba", "Peserta", "Juri", "Nilai 1", "Nilai 2", "Nilai 3", "Total"]];
  snapshot.forEach(doc => {
    const d = doc.data();
    rows.push([d.lomba, d.peserta, d.juri, d.nilai1, d.nilai2, d.nilai3, d.total]);
  });

  downloadExcel(rows, "nilai_semua_lomba.xlsx");
}

// Fungsi helper untuk generate & download Excel dari array data
function downloadExcel(dataRows, fileName) {
  const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");

  XLSX.writeFile(workbook, fileName);
}
