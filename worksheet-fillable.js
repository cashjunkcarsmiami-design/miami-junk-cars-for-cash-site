document.querySelectorAll('.worksheet-input').forEach(function(field){
  function sync(){field.nextElementSibling.textContent=field.value || '________________';field.style.height='auto';field.style.height=field.scrollHeight+'px';}
  field.addEventListener('input',sync);sync();
});
document.querySelectorAll('.worksheet-print-button').forEach(function(button){button.hidden=false;button.addEventListener('click',function(){window.print();});});
