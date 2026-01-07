const file = document.getElementById("file");
const img = document.getElementById("previewImg");
const rw = document.getElementById("rw");
const rh = document.getElementById("rh");
const quality = document.getElementById("quality");
const qVal = document.getElementById("qVal");
const sizePreview = document.getElementById("sizePreview");
const format = document.getElementById("format");

let image = new Image();

qVal.textContent = quality.value + "%";
quality.oninput = updateSize;
format.onchange = updateSize;

file.onchange = () => {
  const f = file.files[0];
  if(!f) return;
  const url = URL.createObjectURL(f);
  image.src = url;
  img.src = url;
  img.hidden = false;

  image.onload = () => {
    const gcd = (a,b)=>b?gcd(b,a%b):a;
    const g = gcd(image.width,image.height);
    rw.value = image.width/g;
    rh.value = image.height/g;
    updateSize();
  };
};

function updateSize(){
  qVal.textContent = quality.value + "%";
  if(!image.src) return;

  const c = document.createElement("canvas");
  const base = 1000;
  c.width = base;
  c.height = Math.round(base*(rh.value/rw.value));
  c.getContext("2d").drawImage(image,0,0,c.width,c.height);

  const data = c.toDataURL(format.value,quality.value/100);
  const bytes = Math.round((data.length*3)/4);
  sizePreview.textContent =
    "Final Size (average):- " +
    (bytes>1024*1024
      ? (bytes/1024/1024).toFixed(2)+" MB"
      : (bytes/1024).toFixed(1)+" KB");
}

function resize(){
  if(!image.src) return alert("Please upload a image");
  const c=document.createElement("canvas");
  c.width=1000;
  c.height=Math.round(1000*(rh.value/rw.value));
  c.getContext("2d").drawImage(image,0,0,c.width,c.height);

  const a=document.createElement("a");
  a.download="resized-image";
  a.href=c.toDataURL(format.value,quality.value/100);
  a.click();
}

function resetAll(){
  img.hidden=true;
  img.src="";
  file.value="";
  rw.value="";
  rh.value="";
  quality.value=90;
  qVal.textContent="90%";
  sizePreview.textContent="Final Size (average):— ";
}