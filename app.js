import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const app = initializeApp(CONFIG.firebase);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null,
  isAdmin = false,
  jobsData = [],
  currentJobId = null;
let currentFilter = { text: "", status: "All", priority: "All" },
  currentSort = "date-desc";
let isLoginMode = true;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

const showToast = (msg, type = "success") => {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-slide-up flex items-center gap-2 ${type === "error" ? "bg-red-500" : "bg-emerald-500"}`;
  el.innerHTML = `<i class="fas ${type === "error" ? "fa-times-circle" : "fa-check-circle"}"></i> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

window.app = {
  toggleAuthMode: (mode) => {
    isLoginMode = mode === "login";
    document.getElementById("btnModeLogin").className = isLoginMode
      ? "px-6 py-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 shadow-sm transition-all text-primary-600 dark:text-white"
      : "px-6 py-2 rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-all";
    document.getElementById("btnModeSignup").className = !isLoginMode
      ? "px-6 py-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 shadow-sm transition-all text-primary-600 dark:text-white"
      : "px-6 py-2 rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-all";

    const nameField = document.getElementById("nameField");
    const btn = document.getElementById("authSubmitBtn");

    if (isLoginMode) {
      nameField.classList.add("hidden");
      btn.innerText = "Login to Dashboard";
    } else {
      nameField.classList.remove("hidden");
      btn.innerText = "Create Account";
    }
  },
  loginGoogle: async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      alert(
        e.code === "auth/unauthorized-domain"
          ? "Domain Error: Add domain in Firebase Console"
          : e.message,
      );
    }
  },
  handleEmailAuth: async () => {
    const email = document.getElementById("authEmail").value,
      pass = document.getElementById("authPassword").value;
    const name = document.getElementById("authName").value;

    if (!email || !pass) return alert("Enter email & password");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        if (!name) return alert("Please enter your full name.");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
      }
      // Clear forms
      document.getElementById("authEmail").value = "";
      document.getElementById("authPassword").value = "";
      document.getElementById("authName").value = "";
    } catch (e) {
      alert(e.message);
    }
  },
  resetPassword: async () => {
    const email = document.getElementById("authEmail").value;
    if (!email) return alert("Enter email to reset");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent!");
    } catch (e) {
      alert(e.message);
    }
  },
  logout: async () => {
    await signOut(auth);
    // Clear all forms on logout
    document.getElementById("authEmail").value = "";
    document.getElementById("authPassword").value = "";
    document.getElementById("authName").value = "";
  },

  toggleSidebar: () => {
    const sb = document.getElementById("mainSidebar");
    const isSmall = sb.classList.contains("w-20");
    const icon = document.getElementById("sidebarIcon");
    if (isSmall) {
      sb.classList.replace("w-20", "w-72");
      document
        .querySelectorAll(".sidebar-text")
        .forEach((t) => t.classList.remove("hidden"));
      document.getElementById("logoText").classList.remove("hidden");
      document
        .querySelectorAll(".nav-btn")
        .forEach((btn) => btn.classList.remove("collapsed-center"));
      document
        .getElementById("brandContainer")
        .classList.remove("justify-center");
      icon.classList.remove("rotate-180");
    } else {
      sb.classList.replace("w-72", "w-20");
      document
        .querySelectorAll(".sidebar-text")
        .forEach((t) => t.classList.add("hidden"));
      document.getElementById("logoText").classList.add("hidden");
      document
        .querySelectorAll(".nav-btn")
        .forEach((btn) => btn.classList.add("collapsed-center"));
      document.getElementById("brandContainer").classList.add("justify-center");
      icon.classList.add("rotate-180");
    }
  },
  toggleTheme: () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  },
  toggleNotifications: () =>
    document.getElementById("notifPanel").classList.toggle("hidden"),

  setView: (view) => {
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    if (view === "dashboard") {
      document.getElementById("dashboardView").classList.remove("hidden");
      document.getElementById("aboutView").classList.add("hidden");
      document.getElementById("btn-dashboard").classList.add("active");
    } else {
      document.getElementById("dashboardView").classList.add("hidden");
      document.getElementById("aboutView").classList.remove("hidden");
      document.getElementById("btn-about").classList.add("active");
    }
  },

  filterJobs: () => {
    currentFilter.text = document
      .getElementById("searchInput")
      .value.toLowerCase();
    currentFilter.status = document.getElementById("statusFilter").value;
    currentFilter.priority = document.getElementById("priorityFilter").value;
    renderJobs();
  },
  sortJobs: () => {
    currentSort = document.getElementById("sortFilter").value;
    renderJobs();
  },

  openModal: () => {
    document.getElementById("dateApplied").valueAsDate = new Date();
    const m = document.getElementById("addModal");
    m.classList.remove("hidden");
    m.classList.add("flex");
    setTimeout(() => {
      m.children[1].classList.replace("scale-95", "scale-100");
      m.children[1].classList.replace("opacity-0", "opacity-100");
    }, 10);
  },
  closeModal: () => {
    const m = document.getElementById("addModal");
    m.children[1].classList.replace("scale-100", "scale-95");
    m.children[1].classList.replace("opacity-100", "opacity-0");
    setTimeout(() => {
      m.classList.add("hidden");
      m.classList.remove("flex");
    }, 300);
  },

  toggleLocationInput: () => {
    const val = document.getElementById("location").value;
    const text = document.getElementById("locationText");
    if (val === "Remote") text.classList.add("hidden");
    else text.classList.remove("hidden");
  },

  showDetails: (id) => {
    const job = jobsData.find((j) => j.id === id);
    if (!job) return;
    currentJobId = id;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal("detailCompany", job.company || "");
    setVal("detailPosition", job.position || "");
    setVal("detailSalary", job.salary || "");
    setVal("detailRecruiterEmail", job.recruiterEmail || "");
    setVal("detailReferral", job.referral || "");
    setVal("detailLocation", job.location || "Remote");

    // Show/Hide Location Text based on value
    const locText = document.getElementById("detailLocationText");
    if (job.location === "Remote") locText.classList.add("hidden");
    else {
      locText.classList.remove("hidden");
      locText.value = job.locationText || "";
    }

    // Add event listener for dynamic toggle in detail view
    document.getElementById("detailLocation").onchange = (e) => {
      if (e.target.value === "Remote") locText.classList.add("hidden");
      else locText.classList.remove("hidden");
    };

    const dateEl = document.getElementById("detailDate");
    if (dateEl) {
      try {
        dateEl.value = job.date
          ? new Date(job.date).toISOString().split("T")[0]
          : "";
      } catch (e) {
        dateEl.value = "";
      }
    }

    setVal("detailJobLink", job.jobLink || "");
    setText("detailIdDisplay", `ID: #${id.slice(-6)}`);
    setVal("detailNotes", job.notes || "");

    setVal("detailStatusSelect", job.status);
    setVal("detailPriority", job.priority || "Medium");
    setVal("detailPlatform", job.platform || "");

    setVal("detailReminderFreq", job.reminderFreq || "0");
    const remDateEl = document.getElementById("detailReminderDate");
    if (remDateEl) {
      if (job.specificReminderTime) {
        const d = new Date(job.specificReminderTime);
        const localISOTime = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);
        remDateEl.value = localISOTime;
      } else {
        remDateEl.value = "";
      }
    }

    const resDiv = document.getElementById("detailResume");
    const noRes = document.getElementById("noResume");

    if (job.resumeBase64) {
      if (resDiv) {
        resDiv.classList.remove("hidden");
        resDiv.classList.add("flex");
      }
      if (noRes) noRes.classList.add("hidden");
      setText("resumeName", job.resumeName);
      window.currentResumeData = job.resumeBase64;
      window.currentResumeName = job.resumeName;
    } else {
      if (resDiv) {
        resDiv.classList.add("hidden");
        resDiv.classList.remove("flex");
      }
      if (noRes) noRes.classList.remove("hidden");
      window.currentResumeData = null;
    }

    // Reset upload status text
    document.getElementById("uploadStatus").classList.add("hidden");

    document.getElementById("detailPanel").classList.remove("translate-x-full");
  },
  closeDetailPanel: () =>
    document.getElementById("detailPanel").classList.add("translate-x-full"),

  // Handle Resume Update from Detail Panel
  handleResumeUpdate: async (input) => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("File too large (Max 1MB)");

    // Show status
    const statusEl = document.getElementById("uploadStatus");
    const statusText = document.getElementById("uploadStatusText");
    statusEl.classList.remove("hidden");
    statusText.innerText = "Processing...";

    const base64 = await toBase64(file);
    window.currentResumeData = base64;
    window.currentResumeName = file.name;

    // Update UI immediately to show user something happened
    document.getElementById("resumeName").innerText = file.name;
    document.getElementById("detailResume").classList.remove("hidden");
    document.getElementById("detailResume").classList.add("flex");
    document.getElementById("noResume").classList.add("hidden");

    statusText.innerText = "Ready to Save";
    statusEl.classList.remove("text-indigo-500");
    statusEl.classList.add("text-emerald-500");
  },

  handleNewResume: async (input) => {
    const file = input.files[0];
    if (file) {
      document.getElementById("newResumeStatus").innerText = "Uploading...";
      // Wait for upload simulation/read
      await new Promise((r) => setTimeout(r, 500));
      document.getElementById("newResumeStatus").innerText = file.name;
      document
        .getElementById("newResumeStatus")
        .classList.add("text-emerald-600", "font-bold");
    }
  },

  updateJobDetails: async () => {
    if (!currentJobId) return;
    const newStatus = document.getElementById("detailStatusSelect").value;
    try {
      const dateVal = document.getElementById("detailDate").value;
      const dateToSave = dateVal
        ? new Date(dateVal).toISOString()
        : new Date().toISOString();

      let updateData = {
        company: document.getElementById("detailCompany").value,
        position: document.getElementById("detailPosition").value,
        salary: document.getElementById("detailSalary").value,
        date: dateToSave,
        jobLink: document.getElementById("detailJobLink").value,
        notes: document.getElementById("detailNotes").value,
        status: newStatus,
        recruiterEmail: document.getElementById("detailRecruiterEmail").value,
        referral: document.getElementById("detailReferral").value,
        location: document.getElementById("detailLocation").value,
        locationText: document.getElementById("detailLocationText").value,
        reminderFreq: document.getElementById("detailReminderFreq").value,
        specificReminderTime:
          document.getElementById("detailReminderDate").value || null,
        priority: document.getElementById("detailPriority").value,
        platform: document.getElementById("detailPlatform").value,
        lastStatusChange: serverTimestamp(),
      };

      if (window.currentResumeData) {
        updateData.resumeBase64 = window.currentResumeData;
        updateData.resumeName = window.currentResumeName;
      }

      // Auto-off logic for rejected/withdrawn
      if (["Rejected", "Withdrawn"].includes(newStatus)) {
        updateData.reminderFreq = "0";
        updateData.specificReminderTime = null;
        document.getElementById("detailReminderFreq").value = "0";
        document.getElementById("detailReminderDate").value = "";
      }

      await updateDoc(
        doc(db, "job_applications", CONFIG.appId, "posts", currentJobId),
        updateData,
      );
      window.app.closeDetailPanel();
      showToast("Changes saved successfully!");
      // Hide upload status on successful save
      document.getElementById("uploadStatus").classList.add("hidden");
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
  },

  updateJobStatus: async (s) => {
    // Visual update only
  },

  clearAllReminders: () => {
    if (confirm("Dismiss all current alerts?")) {
      document.getElementById("notifList").innerHTML =
        '<p class="p-4 text-xs text-center text-slate-400">All cleared.</p>';
      document.getElementById("notifBadgeSidebar").classList.add("hidden");
    }
  },

  downloadResume: () => {
    if (!window.currentResumeData) return;
    const link = document.createElement("a");
    link.href = window.currentResumeData;
    link.download = window.currentResumeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  deleteCurrentJob: async () => {
    if (confirm("Delete permanently?")) {
      await deleteDoc(
        doc(db, "job_applications", CONFIG.appId, "posts", currentJobId),
      );
      window.app.closeDetailPanel();
      showToast("Deleted successfully");
    }
  },

  deleteJobFromList: async (id) => {
    // Stop event propagation is handled in onclick in HTML, but here logic is same
    if (confirm("Delete this application permanently?")) {
      await deleteDoc(doc(db, "job_applications", CONFIG.appId, "posts", id));
      showToast("Deleted successfully");
    }
  },

  importCSV: (input) => {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async (e) => {
      const rows = e.target.result.split("\n").slice(1);
      let c = 0;
      for (const row of rows) {
        // Regex to handle CSVs with quoted strings containing commas
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (cols && cols.length >= 2) {
          // Strip quotes
          const clean = cols.map((col) => col.replace(/^"|"$/g, "").trim());
          await addDoc(
            collection(db, "job_applications", CONFIG.appId, "posts"),
            {
              company: clean[0],
              position: clean[1],
              status: clean[2] || "Applied",
              salary: clean[3] || "-",
              date: new Date().toISOString(),
              platform: clean[5] || "Import",
              jobLink: clean[6] || "",
              notes: clean[7] || "",
              ownerId: currentUser.uid,
              ownerEmail: currentUser.email,
              createdAt: serverTimestamp(),
            },
          );
          c++;
        }
      }
      showToast(`Imported ${c} jobs`);
    };
    r.readAsText(f);
  },
  exportToExcel: () => {
    if (jobsData.length === 0) return showToast("No data to export", "error");
    let csv =
      "Company,Position,Status,Salary,Applied,Source,Link,Notes,Applicant,Recruiter,Referral,Location,Priority\n";
    jobsData.forEach(
      (j) =>
        (csv += `"${j.company}","${j.position}","${j.status}","${j.salary}","${j.date}","${j.platform || ""}","${j.jobLink || ""}","${j.notes || ""}","${j.ownerEmail}","${j.recruiterEmail || ""}","${j.referral || ""}","${j.location || ""} ${j.locationText || ""}","${j.priority || ""}"\n`),
    );
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    const filename = `JobTrackr_${currentUser.displayName || "User"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  generateAIEmail: () => {
    const job = jobsData.find((j) => j.id === currentJobId);
    if (!job) return;

    const subject = `Follow up: Application for ${job.position} at ${job.company}`;
    const body = `Dear Hiring Team,\n\nI hope this email finds you well.\n\nI recently applied for the ${job.position} role (Applied: ${formatDate(job.date)}) and wanted to express my continued interest in the position.\n\nI would appreciate any updates regarding my application status.\n\nBest regards,\n${currentUser.displayName || "Your Name"}`;

    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  },
};

// --- Internal: Render & Logic ---
const renderJobs = () => {
  const list = document.getElementById("job-list-body");
  const empty = document.getElementById("empty-state");
  list.innerHTML = "";

  let filtered = jobsData.filter((job) => {
    const matchText = (job.company + job.position)
      .toLowerCase()
      .includes(currentFilter.text);
    const matchStatus =
      currentFilter.status === "All" || job.status === currentFilter.status;
    const matchPriority =
      currentFilter.priority === "All" ||
      job.priority === currentFilter.priority;
    return matchText && matchStatus && matchPriority;
  });

  filtered.sort((a, b) => {
    if (currentSort === "date-desc") return new Date(b.date) - new Date(a.date);
    if (currentSort === "date-asc") return new Date(a.date) - new Date(b.date);
    if (currentSort === "salary-desc")
      return (
        (parseInt(b.salary.replace(/\D/g, "")) || 0) -
        (parseInt(a.salary.replace(/\D/g, "")) || 0)
      );
  });

  if (filtered.length === 0) {
    empty.classList.remove("hidden");
    empty.classList.add("flex");
    return;
  }
  empty.classList.add("hidden");
  empty.classList.remove("flex");

  filtered.forEach((job) => {
    const div = document.createElement("div");
    div.className =
      "grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group border-b border-slate-50 dark:border-slate-800/50";
    div.onclick = (e) => {
      if (!e.target.closest("button")) window.app.showDetails(job.id);
    };
    let badge = "bg-slate-100 text-slate-600";
    if (job.status === "Interview") badge = "bg-amber-100 text-amber-700";
    if (job.status === "Offer") badge = "bg-emerald-100 text-emerald-700";
    if (job.status === "Rejected") badge = "bg-rose-100 text-rose-700";
    if (job.status === "Applied") badge = "bg-primary-100 text-primary-700";

    let priColor = "bg-slate-100 text-slate-600";
    if (job.priority === "High") priColor = "bg-rose-100 text-rose-700";
    if (job.priority === "Medium") priColor = "bg-amber-100 text-amber-700";
    if (job.priority === "Low") priColor = "bg-blue-100 text-blue-700";

    // Combine Location and Source for display
    let details = job.location || "";
    if (job.platform) details += (details ? " • " : "") + job.platform;

    // Safely format updated date
    const updatedDate = job.lastStatusChange
      ? formatDate(new Date(job.lastStatusChange.seconds * 1000).toISOString())
      : "-";

    div.innerHTML = `
                    <div class="col-span-3">
                        <p class="font-bold text-slate-800 dark:text-white truncate flex items-center gap-2">
                           ${job.company} 
                           <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${priColor}">${job.priority || "Med"}</span>
                        </p>
                        <p class="text-xs text-slate-500 font-medium truncate">${job.position}</p>${isAdmin ? `<p class="text-[10px] text-primary-500 mt-0.5">${job.ownerEmail}</p>` : ""}
                    </div>
                    <div class="col-span-1 text-center"><span class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badge}">${job.status}</span></div>
                    
                    <div class="col-span-1 hidden md:block text-sm text-slate-600 dark:text-slate-300 font-medium">${formatDate(job.date)}</div>
                    
                    <div class="col-span-1 hidden lg:block text-sm text-slate-500">${updatedDate}</div>
                    
                    <div class="col-span-1 hidden xl:block text-sm text-slate-500 truncate" title="${job.locationText || job.location}">${job.location || "-"}</div>
                    <div class="col-span-1 hidden xl:block text-sm text-slate-500 truncate">${job.platform || "-"}</div>
                    
                    <div class="col-span-1 hidden sm:block text-sm text-right text-slate-600 dark:text-slate-300 font-medium">${job.salary || "-"}</div>
                    
                    <div class="col-span-5 md:col-span-3 lg:col-span-3 text-right flex justify-end gap-2">
                        <button onclick="window.app.showDetails('${job.id}')" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center" title="View"><i class="fas fa-eye"></i></button>
                        <button onclick="event.stopPropagation(); window.app.deleteJobFromList('${job.id}')" class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
    list.appendChild(div);
  });
};

const updateStats = () => {
  document.getElementById("stat-total").innerText = jobsData.length;
  document.getElementById("stat-active").innerText = jobsData.filter(
    (j) => !["Rejected", "Withdrawn"].includes(j.status),
  ).length;
  document.getElementById("stat-interview").innerText = jobsData.filter(
    (j) => j.status === "Interview",
  ).length;
  document.getElementById("stat-rejected").innerText = jobsData.filter(
    (j) => j.status === "Rejected",
  ).length;
};

const checkReminders = () => {
  const list = document.getElementById("notifList");
  const badge = document.getElementById("notifBadgeSidebar");
  list.innerHTML = "";
  let count = 0;
  const now = new Date();

  jobsData.forEach((job) => {
    if (["Rejected", "Withdrawn", "Offer"].includes(job.status)) return;

    if (job.specificReminderTime) {
      if (now >= new Date(job.specificReminderTime)) {
        addNotif(job, "Scheduled Reminder", "bg-primary-50 text-primary-700");
        count++;
      }
    }
    const lastChange = job.lastStatusChange?.seconds
      ? new Date(job.lastStatusChange.seconds * 1000)
      : new Date(job.createdAt.seconds * 1000);

    const diff = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
    const freq = parseInt(job.reminderFreq || 3);
    if (freq > 0 && diff >= freq) {
      addNotif(job, `Stagnant for ${diff} days`, "bg-amber-50 text-amber-700");
      count++;
    }
  });

  badge.innerText = count;
  badge.classList.toggle("hidden", count === 0);
  if (count === 0)
    list.innerHTML =
      '<p class="p-4 text-xs text-center text-slate-400">No active alerts.</p>';
};

const addNotif = (job, text, colorClass) => {
  const div = document.createElement("div");
  div.className = `p-3 m-2 rounded-lg text-sm border cursor-pointer hover:opacity-80 transition-opacity flex justify-between items-center ${colorClass}`;
  div.innerHTML = `
                <div class="flex-1">
                    <div class="font-bold flex justify-between"><span>${job.company}</span></div>
                    <div class="text-xs mt-1 opacity-80">${text}</div>
                </div>
                <button class="ml-2 text-xs opacity-50 hover:opacity-100" onclick="event.stopPropagation(); window.app.dismissReminder('${job.id}', '${text}')">Dismiss</button>
            `;
  div.onclick = () => window.app.showDetails(job.id);
  document.getElementById("notifList").appendChild(div);
};

// Added Dismiss Logic
window.app.dismissReminder = async (jobId, text) => {
  const job = jobsData.find((j) => j.id === jobId);
  if (!job) return;

  let updateData = {};
  if (text === "Scheduled Reminder") {
    updateData.specificReminderTime = null; // Clear specific
  } else {
    updateData.lastStatusChange = serverTimestamp(); // Reset timer for periodic
  }

  try {
    await updateDoc(
      doc(db, "job_applications", CONFIG.appId, "posts", jobId),
      updateData,
    );
    showToast("Reminder dismissed");
  } catch (e) {
    console.error(e);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    isAdmin = user.email === CONFIG.adminEmail;
    document.getElementById("loginScreen").classList.add("hidden");

    document.getElementById("userNameDisplay").innerText =
      user.displayName || user.email.split("@")[0];
    if (document.getElementById("welcomeName"))
      document.getElementById("welcomeName").innerText = user.displayName
        ? user.displayName.split(" ")[0]
        : "User";

    document.getElementById("userRoleDisplay").innerText = isAdmin
      ? "Administrator"
      : "Standard User";
    if (user.photoURL)
      document.getElementById("userAvatar").innerHTML =
        `<img src="${user.photoURL}" class="w-full h-full rounded-full">`;

    const q = collection(db, "job_applications", CONFIG.appId, "posts");
    onSnapshot(q, (snapshot) => {
      jobsData = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (isAdmin || data.ownerId === currentUser.uid)
          jobsData.push({ id: d.id, ...data });
      });
      renderJobs();
      updateStats();
      checkReminders();
    });
  } else {
    document.getElementById("loginScreen").classList.remove("hidden");
  }
});

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

document.getElementById("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const btn = document.getElementById("saveJobBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
  btn.disabled = true;

  const fileInput = document.getElementById("resumeFile");
  let resumeBase64 = null,
    resumeName = null;
  if (fileInput.files[0]) {
    if (fileInput.files[0].size > 1024 * 1024) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      return alert("File too large (Max 1MB)");
    }
    resumeName = fileInput.files[0].name;
    resumeBase64 = await toBase64(fileInput.files[0]);
  }

  try {
    await addDoc(collection(db, "job_applications", CONFIG.appId, "posts"), {
      company: document.getElementById("company").value,
      position: document.getElementById("position").value,
      status: document.getElementById("status").value,
      salary: document.getElementById("salary").value,
      date:
        document.getElementById("dateApplied").value ||
        new Date().toISOString(),
      jobLink: document.getElementById("jobLink").value,
      notes: document.getElementById("notes").value,
      reminderFreq: document.getElementById("reminderFreq").value,
      specificReminderTime:
        document.getElementById("reminderDate").value || null,
      resumeBase64,
      resumeName,
      recruiterEmail: document.getElementById("recruiterEmail").value,
      referral: document.getElementById("referral").value,
      location: document.getElementById("location").value,
      locationText: document.getElementById("locationText").value,
      platform: document.getElementById("platform").value,
      priority: document.getElementById("priority").value,
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email,
      createdAt: serverTimestamp(),
      lastStatusChange: serverTimestamp(),
    });
    window.app.closeModal();
    document.getElementById("jobForm").reset();
    showToast("Application Saved Successfully!");
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Clear forms on load
document.getElementById("authEmail").value = "";
document.getElementById("authPassword").value = "";
document.getElementById("authName").value = "";
document.getElementById("jobForm").reset();

if (
  localStorage.getItem("theme") === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
}
