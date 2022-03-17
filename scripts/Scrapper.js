const puppeteer = require("puppeteer");

(async function scrapOLX() {
  const browser = await puppeteer.launch({ dumpio: false });
  const [page] = await browser.pages();
  //const baseURL = "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/venda/casas?bas=2&gsp=2&pe=1200000&ps=600000&q=condominio&ros=3&sp=2&ss=4";
  var baseURL = "https://sp.olx.com.br/sao-paulo-e-regiao/zona-oeste/lapa/imoveis/venda/apartamentos?bas=2&gsp=2&pe=800000&ros=3&sp=2&se=4&ss=3";
  //var baseURL = "https://sp.olx.com.br/sao-paulo-e-regiao/zona-oeste/imoveis/venda/casas?bas=2&gsp=2&pe=1200000&ps=600000&q=condominio&ros=3&sp=2&ss=4";
  //var baseURL = "https://sp.olx.com.br/sao-paulo-e-regiao/centro/santa-cecilia/imoveis/venda/apartamentos?bas=2&gsp=1&ros=3&sp=2&se=4&ss=3";
  baseURL = baseURL + "&o=";
  var pageNumber = 1;

  while (true) {
    try {
      value = 0; information = 0; url = 0;
      console.log("Open URL= " + baseURL + pageNumber);
      await page.goto(baseURL + pageNumber);
      value = await page.$$eval('div.fnmrjs-9.gqfQzY > div > div > span.sc-ifAKCX.eoKYee', titles =>
        titles.map(titles => titles.getAttribute('aria-label')))
      console.log("Values= " + value.length);

      information = await page.$$eval('div.fnmrjs-6.iNpuEh > div > span', titles =>
        titles.map(titles => titles.getAttribute('title')))
      console.log("Information= " + information.length);

      url = await page.$$eval('ul.sc-1fcmfeb-1.kntIvV > li > a', titles =>
        titles.map(titles => titles.getAttribute('href')))
      console.log("URLs= " + url.length);
      if (!value.length) break; // if 0 exit the loop.
      else parseInfo(value, information, url);
      pageNumber++;
    }
    catch (err) {
      console.log("Erro= " + err);
    }
  }
  persist();
  await browser.close();
})();

var result = [];
result.push("VALOR TOTAL" + ';' +
  "METRAGEM" + ';' +
  "VALOR MT2" + ';' +
  "CONDOMÍNIO" + ';' +
  "CUSTO TOTAL MT2" + ';' +
  "LINK");

function parseInfo(value, information, url) {
 
  var totalPriceList = value.map(s => s.match(/\d+.\d+.\d+/gm))

  for (var i = 0; i < totalPriceList.length; i++) {
    totalPriceList[i] = parseFloat(totalPriceList[i].toString().replace(/\D/g, ''))
  }
  
  var mtList = information.map(function (item) {
    if (item.match(/\d+[0-9]m/gm) == null) {
      return "0";
    } else {
      var a = item.match(/\d+[0-9]m/gm)
      const b = []
      b.push(a[0])
      return b.map(s => s.match(/\d+[0-9]/gm))
    }
  })

  mtListFormated = mtList.map(i => Number(i))

  var condominioList = information.map(function (item) {
     if (item.match(/\$\s([0-9]*[.])?[0-9]+/gm) == null) {
       return "0";
     } else {
       var a = item.match(/\$\s([0-9]*[.])?[0-9]+/gm)
       const b = []
       b.push(a[0])
       return b.map(s => s.match(/([0-9]*[.])?[0-9]+/gm))
     }
   })

  for (let i = 0, n = mtList.length; i != n; i++) {
    var mt2 = parseInt(totalPriceList[i] / mtListFormated[i]);
    var custoTotal = mt2 + parseInt(condominioList[i]);
     console.log("custoTotal " + i + " = " + custoTotal);

    result.push( totalPriceList[i] + ';'  
                +mtList[i] + ';'
                +mt2 + ';'
                +condominioList[i] + ';' 
                +custoTotal + ';'
                +url[i])
  }
}

function persist() {
  const xlsx = require("xlsx");
  const test = result.map(m => [m]);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(test);
  xlsx.utils.book_append_sheet(wb, ws);
  xlsx.writeFile(wb, "test" + Date.now() + ".xlsx");
}