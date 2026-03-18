const canvas = document.getElementById("plot");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

const W = canvas.width;
const H = canvas.height;
const PAD = 40;

let dataX = [], dataY = [];
let showTrend = true;
let rValue = 0;

/* ---------- helpers ---------- */
const mean = a => a.reduce((s,v)=>s+v,0)/a.length;

function correlation(x, y) {
  const mx = mean(x), my = mean(y);
  let num=0, dx=0, dy=0;
  for (let i=0;i<x.length;i++){
    num += (x[i]-mx)*(y[i]-my);
    dx += (x[i]-mx)**2;
    dy += (y[i]-my)**2;
  }
  return num / Math.sqrt(dx*dy);
}

function strength(r){
  const a = Math.abs(r);
  if (a>0.8) return "Strong";
  if (a>0.5) return "Moderate";
  if (a>0.3) return "Weak";
  return "Very weak / none";
}

const map = (v,min,max,a,b)=> a+(v-min)/(max-min)*(b-a); //min,max = where the value currently lives
                                                        //a,b = where you want it to live

/* ---------- drawing ---------- */
function clear(){
  ctx.clearRect(0,0,W,H);
}

function grid(){
  ctx.strokeStyle="rgba(0,0,0,.08)";
  for(let x=PAD;x<W;x+=40){
    ctx.beginPath();
    ctx.moveTo(x,PAD);
    ctx.lineTo(x,H-PAD);
    ctx.stroke();
  }
  for(let y=PAD;y<H;y+=40){
    ctx.beginPath();
    ctx.moveTo(PAD,y);
    ctx.lineTo(W-PAD,y);
    ctx.stroke();
  }
}

function axes(){
  ctx.strokeStyle="#555";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(PAD,H-PAD);
  ctx.lineTo(W-PAD,H-PAD);
  ctx.moveTo(PAD,PAD);
  ctx.lineTo(PAD,H-PAD);
  ctx.stroke();
}

function ticks(xmin,xmax,ymin,ymax){
  ctx.fillStyle="#555";
  ctx.font="11px system-ui";
  ctx.fillText(xmin, PAD, H-PAD+15);
  ctx.fillText(xmax, W-PAD-10, H-PAD+15);
  ctx.fillText(ymax, PAD-25, PAD+5);
  ctx.fillText(ymin, PAD-25, H-PAD);
}

function points(x,y,color){
  x.forEach((xi,i)=>{ //xi = current x value , i = index
    const px = map(xi,xmin,xmax,PAD,W-PAD);
    const py = map(y[i],ymin,ymax,H-PAD,PAD);
    ctx.beginPath();
    ctx.fillStyle=color;
    ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fill();
  });
}

function trendLine(x,y,color){
  if(!showTrend) return;
  const mx=mean(x), my=mean(y);
  let num=0, den=0;
  for(let i=0;i<x.length;i++){
    num+=(x[i]-mx)*(y[i]-my);
    den+=(x[i]-mx)**2;
  }
  const m=num/den, b=my-m*mx;

  const y1=m*xmin+b;
  const y2=m*xmax+b;

  ctx.strokeStyle=color;
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(map(xmin,xmin,xmax,PAD,W-PAD), map(y1,ymin,ymax,H-PAD,PAD));
  ctx.lineTo(map(xmax,xmin,xmax,PAD,W-PAD), map(y2,ymin,ymax,H-PAD,PAD));
  ctx.stroke();
}

/* ---------- interaction ---------- */
canvas.onmousemove = e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left;
  const my=e.clientY-rect.top;

  for(let i=0;i<dataX.length;i++){
    const px=map(dataX[i],xmin,xmax,PAD,W-PAD);
    const py=map(dataY[i],ymin,ymax,H-PAD,PAD);
    if(Math.hypot(mx-px,my-py)<7){
      tooltip.textContent=`(${dataX[i]}, ${dataY[i]})`;
      tooltip.style.left=e.pageX+"px";
      tooltip.style.top=e.pageY+"px";
      tooltip.style.opacity=1;
      return;
    }
  }
  tooltip.style.opacity=0;
};

/* ---------- main ---------- */
let xmin,xmax,ymin,ymax;

function generate(){
  dataX=document.getElementById("x-data").value.split(",").map(Number);
  dataY=document.getElementById("y-data").value.split(",").map(Number);
  if(dataX.length!==dataY.length) return alert("Length mismatch");

  xmin=Math.min(...dataX);
  xmax=Math.max(...dataX);
  ymin=Math.min(...dataY);
  ymax=Math.max(...dataY);

  rValue=correlation(dataX,dataY);
  redraw();
}

function redraw(){
  clear();
  grid();
  axes();
  ticks(xmin,xmax,ymin,ymax);

  const color = rValue>=0 ? "#1f77b4" : "#e74c3c";
  points(dataX,dataY,color);
  trendLine(dataX,dataY,color);

  document.getElementById("output").textContent =
    `Correlation r = ${rValue.toFixed(2)} (${strength(rValue)})`;
}

function toggleTrend(){
  showTrend=!showTrend;
  redraw();
}

function randomData(){
  dataX=[...Array(10)].map((_,i)=>i+1);
  dataY=dataX.map(()=>Math.round(Math.random()*10));
  document.getElementById("x-data").value=dataX.join(",");
  document.getElementById("y-data").value=dataY.join(",");
  generate();
}

function resetPlot(){
  dataX=[]; dataY=[];
  clear();
  document.getElementById("output").textContent="";
}

