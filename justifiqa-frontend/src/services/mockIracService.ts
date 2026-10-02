import type {
  IracAnalysis,
  LegalDocumentTemplateId,
  LegalDocumentDraft,
  DocumentClause,
} from '../types/irac';

export class MockIracService {
  static async analyzeFactsToIrac(factsText: string, caseTitle?: string): Promise<IracAnalysis> {
    // Simulate AI neural processing & legal ontology lookup delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const id = `IRAC-AI-${Date.now()}`;
    const title = caseTitle || 'Analisis Sengketa & Pelanggaran Kontrak Komersial';

    // Check keywords to tailor realistic response or return rich default legal analysis
    const isProperty = factsText.toLowerCase().includes('tanah') || factsText.toLowerCase().includes('rumah');
    const isLabor = factsText.toLowerCase().includes('phk') || factsText.toLowerCase().includes('gaji');

    let issue = '';
    let rule = '';
    let application = '';
    let conclusion = '';
    let relevantArticles: string[] = [];

    if (isProperty) {
      issue =
        'Apakah tindakan pihak lawan yang menguasai atau memindahtangankan objek tanah/properti tanpa persetujuan tertulis pemegang hak yang sah merupakan perbuatan melawan hukum (onrechtmatige daad) atau penyerobotan hak atas tanah?';
      rule =
        '1. Pasal 1365 KUHPerdata (Perbuatan Melawan Hukum) — Tiap perbuatan melanggar hukum yang membawa kerugian kepada orang lain, mewajibkan orang karena salahnya menerbitkan kerugian itu, mengganti kerugian tersebut.\n2. Pasal 385 KUHP (Penyerobotan Tanah) — Diancam dengan pidana penjara paling lama empat tahun barang siapa dengan maksud menguntungkan diri sendiri atau orang lain secara melawan hukum menjual, menukarkan atau membebani sesuatu hak atas tanah.\n3. Undang-Undang No. 5 Tahun 1960 tentang Pokok-Pokok Agraria (UUPA).';
      application =
        'Berdasarkan kronologi yang disampaikan, kepemilikan sertifikat/bukti alas hak berada pada pihak Klien. Tindakan sepihak dari pihak lawan yang menduduki atau mengklaim tanpa adanya akta jual beli (AJB) yang sah di hadapan PPAT jelas memenuhi unsur kesalahan dan kerugian nyata sebagaimana dimaksud dalam Pasal 1365 KUHPerdata serta berpotensi memenuhi unsur pidana Pasal 385 KUHP.';
      conclusion =
        'Pihak Klien berada pada posisi hukum (legal standing) yang kuat. Disarankan untuk segera melayangkan Surat Somasi Terbuka (Peringatan Hukum) maksimal 2x3 hari kalender, dilanjutkan dengan permohonan blokir sertifikat ke BPN setempat, dan persiapan gugatan PMH di Pengadilan Negeri.';
      relevantArticles = ['Pasal 1365 KUHPerdata', 'Pasal 385 KUHP', 'UU No. 5 Tahun 1960 (UUPA)'];
    } else if (isLabor) {
      issue =
        'Apakah pemutusan hubungan kerja (PHK) sepihak dan penahanan pesangon/gaji yang dilakukan oleh perusahaan terhadap Klien bertentangan dengan ketentuan perundang-undangan ketenagakerjaan yang berlaku?';
      rule =
        '1. Undang-Undang No. 13 Tahun 2003 tentang Ketenagakerjaan jo. Undang-Undang No. 6 Tahun 2023 tentang Penetapan Perppu No. 2 Tahun 2022 tentang Cipta Kerja.\n2. Peraturan Pemerintah (PP) No. 35 Tahun 2021 tentang PKWT, Alih Daya, Waktu Kerja dan Waktu Istirahat, dan Pemutusan Hubungan Kerja (Pasal 40-59 mengenai hak pesangon dan UPMK).\n3. Pasal 1338 KUHPerdata mengenai asas Pacta Sunt Servanda.';
      application =
        'Tindakan perusahaan yang melakukan PHK tanpa melalui tahapan perundingan bipartit serta tidak membayarkan hak uang pesangon, uang penghargaan masa kerja (UPMK), dan uang penggantian hak sesuai ketentuan PP 35/2021 merupakan pelanggaran hukum ketenagakerjaan prosedural dan materiil.';
      conclusion =
        'Klien berhak atas pembayaran kompensasi penuh (Pesangon + UPMK + UPH). Langkah hukum taktis: 1) Ajukan permohonan perundingan Bipartit tertulis; 2) Jika dalam 30 hari tidak ada kesepakatan, daftarkan perselisihan ke Dinas Ketenagakerjaan (Tripartit/Mediasi); 3) Persiapkan gugatan ke Pengadilan Hubungan Industrial (PHI).';
      relevantArticles = ['UU No. 6 Tahun 2023 (Cipta Kerja)', 'PP No. 35 Tahun 2021', 'Pasal 1338 KUHPerdata'];
    } else {
      issue =
        'Apakah kelalaian pihak mitra bisnis dalam memenuhi kewajiban pembayaran tepat waktu dan pelanggaran klausul kesepakatan dapat dikualifikasikan sebagai Wanprestasi (Cidera Janji) yang menimbulkan hak ganti rugi bagi Klien?';
      rule =
        '1. Pasal 1238 KUHPerdata — Debitur dinyatakan lalai dengan surat perintah, atau dengan akta sejenis itu, atau berdasarkan kekuatan dari perikatan sendiri.\n2. Pasal 1243 KUHPerdata — Penggantian biaya, kerugian dan bunga karena tak dipenuhinya suatu perikatan mulai diwajibkan, bila debitur, walaupun telah dinyatakan lalai, tetap melalaikan kewajibannya.\n3. Pasal 1338 KUHPerdata — Semua persetujuan yang dibuat secara sah berlaku sebagai undang-undang bagi mereka yang membuatnya (Asas Pacta Sunt Servanda).';
      application =
        'Fakta menunjukkan adanya perjanjian yang sah mengikat kedua belah pihak. Keterlambatan atau penolakan pembayaran oleh mitra melebihi tanggal jatuh tempo tanpa alasan overmacht/force majeure memenuhi unsur wanprestasi formal sebagaimana diatur dalam Pasal 1238 jo. 1243 KUHPerdata.';
      conclusion =
        'Klien berhak menuntut pembuktian pelaksanaan kewajiban sekaligus ganti rugi materiil (pokok tagihan + bunga moratoir). Langkah awal wajib: Terbitkan Surat Somasi I & II dengan batas waktu tegas 7 hari kerja sebelum mendaftarkan gugatan Wanprestasi ke Pengadilan Negeri atau arbitrase yang disepakati.';
      relevantArticles = ['Pasal 1238 KUHPerdata', 'Pasal 1243 KUHPerdata', 'Pasal 1338 KUHPerdata'];
    }

    return {
      id,
      caseTitle: title,
      storyOfFacts: factsText,
      issue,
      rule,
      application,
      conclusion,
      confidenceScore: 96.4,
      generatedAt: new Date().toISOString(),
      relevantArticles,
    };
  }

  static async generateDocumentDraft(
    templateId: LegalDocumentTemplateId,
    irac: IracAnalysis,
    clientName: string,
    advocateName: string,
    opponentName: string = 'PT Mitra Bisnis / Pihak Terkait'
  ): Promise<LegalDocumentDraft> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const id = `DRAFT-${templateId}-${Date.now()}`;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let title = '';
    let clauses: DocumentClause[] = [];

    if (templateId === 'SOMASI_TERBUKA') {
      title = `SURAT PERINGATAN HUKUM (SOMASI TERBUKA & PENGGANTIAN KERUGIAN)`;
      clauses = [
        {
          id: 'CLS-01',
          title: 'KLAUSUL 1: POSISI DAN KEDUDUKAN HUKUM (LEGAL STANDING)',
          body: `Bahwa kami, ${advocateName}, selaku Advokat dan Penasihat Hukum dari dan oleh karenanya bertindak untuk dan atas nama ${clientName} ("Klien"), dengan ini menyampaikan Peringatan Hukum (Somasi) yang tegas kepada ${opponentName} ("Pihak yang Disomasi").`,
        },
        {
          id: 'CLS-02',
          title: 'KLAUSUL 2: KRONOLOGI DAN DASAR FAKTA HUKUM',
          body: `Bahwa berdasarkan fakta hukum yang terjadi: ${irac.storyOfFacts}\nBahwa tindakan dan/atau kelalaian Saudara tersebut telah nyata-nyata melanggar hak hukum Klien kami serta bertentangan dengan asas itikad baik (goede trouw).`,
        },
        {
          id: 'CLS-03',
          title: 'KLAUSUL 3: DASAR HUKUM DAN KUALIFIKASI PELANGGARAN',
          body: `Bahwa perbuatan Saudara sebagaimana diuraikan di atas dikualifikasikan sebagai pelanggaran berat berdasarkan rumusan yuridis:\n${irac.rule}\nOleh karena itu, kewajiban Saudara untuk mengganti kerugian Klien kami telah timbul secara sempurna demi hukum.`,
        },
        {
          id: 'CLS-04',
          title: 'KLAUSUL 4: TUNTUTAN HUKUM DAN BATAS WAKTU (ULTIMATUM)',
          body: `Berdasarkan hal-hal tersebut di atas, kami menghimbau sekaligus MEMPERINGATKAN dengan tegas kepada Saudara agar dalam tenggang waktu selambat-lambatnya 7 (tujuh) hari kalender terhitung sejak tanggal surat ini diterbitkan, Saudara segera memenuhi seluruh kewajiban hukum/pembayaran kerugian secara penuh kepada Klien kami. Apabila ultimatum ini diabaikan, kami akan segera menempuh segala jalur hukum yang tersedia baik pidana maupun perdata tanpa peringatan lanjutan.`,
        },
      ];
    } else if (templateId === 'PERJANJIAN_DAMAI') {
      title = `PERJANJIAN KESEPAKATAN DAMAI DAN PENYELESAIAN SENGKETA (DADING)`;
      clauses = [
        {
          id: 'CLS-01',
          title: 'PASAL 1: PARA PIHAK DAN LATAR BELAKANG SENGKETA',
          body: `Pada hari ini, ${dateStr}, telah disepakati Perjanjian Perdamaian (selanjutnya disebut "Perjanjian") antara ${clientName} selaku Pihak Pertama dan ${opponentName} selaku Pihak Kedua. Para Pihak dengan didampingi oleh Advokat ${advocateName} sepakat untuk mengakhiri sengketa hukum terkait: ${irac.caseTitle}.`,
        },
        {
          id: 'CLS-02',
          title: 'PASAL 2: KESEPAKATAN PENYELESAIAN & PEMBAYARAN KOMPENSASI',
          body: `Pihak Kedua mengakui kewajibannya dan sepakat untuk melakukan penyelesaian/pembayaran kewajiban secara penuh kepada Pihak Pertama selambat-lambatnya 14 hari kalender setelah penandatanganan Perjanjian ini. Para Pihak sepakat bahwa pembayaran dilakukan melalui mekanisme rekening Escrow Mutex yang aman dan transparan.`,
        },
        {
          id: 'CLS-03',
          title: 'PASAL 3: PELEPASAN HAK GUGAT (RELEASE AND DISCHARGE)',
          body: `Dengan terpenuhinya kewajiban sebagaimana dimaksud pada Pasal 2, Para Pihak menyatakan sengketa selesai secara tuntas dan mengikat (Eindbeslissing), serta saling melepaskan hak untuk mengajukan tuntutan/gugatan hukum apapun di masa depan (Release and Discharge) sesuai ketentuan Pasal 1851 dan Pasal 1858 KUHPerdata.`,
        },
      ];
    } else {
      title = `DRAF GUGATAN WANPRESTASI / PERBUATAN MELAWAN HUKUM`;
      clauses = [
        {
          id: 'CLS-01',
          title: 'POSITA (FUNDAMENTUM PETENDI) - ALASAN-ALASAN GUGATAN',
          body: `1. Bahwa Penggugat (${clientName}) adalah pihak yang memiliki kedudukan hukum sah dalam perkara ini, didampingi oleh kuasa hukum ${advocateName}.\n2. Bahwa Tergugat (${opponentName}) telah melakukan perbuatan yang merugikan Penggugat sebagaimana fakta berikut: ${irac.storyOfFacts}.\n3. Bahwa perbuatan Tergugat tersebut jelas memenuhi rumusan Pasal: ${irac.relevantArticles.join(', ')}.`,
        },
        {
          id: 'CLS-02',
          title: 'PETITUM - TUNTUTAN YANG DIMOHONKAN KEPADA MAJELIS HAKIM',
          body: `Berdasarkan seluruh dalil Posita di atas, Penggugat memohon kepada Yang Mulia Majelis Hakim Pengadilan Negeri untuk menjatuhkan putusan sebagai berikut:\n1. Menerima dan mengabulkan Gugatan Penggugat untuk seluruhnya;\n2. Menyatakan Tergugat telah terbukti secara sah dan meyakinkan melakukan Wanprestasi/Perbuatan Melawan Hukum;\n3. Menghukum Tergugat untuk membayar ganti rugi materiil dan immateriil secara tunai dan sekaligus;\n4. Menghukum Tergugat untuk membayar seluruh biaya perkara yang timbul.`,
        },
      ];
    }

    return {
      id,
      templateId,
      title,
      clientName,
      advocateName,
      opponentName,
      createdAt: new Date().toISOString(),
      clauses,
    };
  }
}
