const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const parse = async () => {
  const getHTML = async (url) => {
    const { data } = await axios.get(url);
    return cheerio.load(data);
  };

  let res = [];
  let arrLinks = [];
  const $ = await getHTML(`https://geo.koltyrin.ru/strany_mira.php`);
  $('tr td.list a').each((i, element) => {
    let link = $(element).attr('href');
    link = link.replace('country', 'goroda');
    link = link.replace(' ', '%20');
    let newlink = `https://geo.koltyrin.ru/${encodeURIComponent(link)}&page=1`;
    newlink = newlink.replace('%3F', '?');
    newlink = newlink.replace('%3D', '=');
    arrLinks.push(newlink);
  });

  for(let i=0; i<arrLinks.length; i++) {
    const selector = await getHTML(arrLinks[i]);
    selector('tr.bg_white').each((i, element) => {
      let options = new Object();
      let regex = /city=(.+)&/;
      const country = selector('.global').find('h1.name').text();
      options.country = country;
      let next = selector('table').find('tr td:last-child a.menu').attr('href');
      next = `https://geo.koltyrin.ru/${encodeURIComponent(next)}`;
      next = next.replace('%3F', '?');
      next = next.replace('%26', '&');
      next = next.replace('%3D', '=');
      next = next.replace('%3D', '=');
      const city = selector(element).find('td:first-child span').text();
      options.city = city;
      let link = selector(element).find('td:first-child a').attr('href');
      let match = regex.exec(link.toString());
      let partLink = match[1];
      options.partLink = partLink;
      link = `https://geo.koltyrin.ru/${link}`;
      options.link = link;
      const polution = selector(element).find('td:nth-child(2)').text();
      options.polution = polution;
      let add = arrLinks.find(item => {
        if (item === next) {
          return true;
        } else {
          return false;
        }
      });
      if(!add && next !== 'https://geo.koltyrin.ru/undefined') {
        arrLinks.push(next);
        fs.appendFileSync('./file.txt', `${next};\n`);
      }
      res.push(options);
    });
  }

  const csvWriter = createCsvWriter({
    path: 'geo.csv',
    header: [
        {id: 'country', title: 'Страна'},
        {id: 'city', title: 'Город'},
        {id: 'link', title: 'Ссылка'},
        {id: 'partLink', title: 'Код с ссылки'},
        {id: 'polution', title: 'Население'}
    ]
  }); 

  csvWriter.writeRecords(res)
    .then(() => {
        console.log('...Done');
  });

};

parse();