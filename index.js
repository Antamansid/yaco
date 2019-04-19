function getModules(){
  axios({
    method:'post',
    url:'http://localhost/getModule',
    data: {name: nameFolder}
  }).then((response)=>{
    let modules = response.data;
    let moduleScript = document.createElement('script');
    moduleScript.defer = true;
    moduleScript.text = `let modules = ${modules}`;
    document.body.appendChild(moduleScript);
    moduleScript.addEventListener('load', console.log($('h1').text()))
  })
}
function showPanelForMakingNewProject(){
  let divMakingNewProject = document.createElement('div');
  let inputNameProject = document.createElement('input');
  let buttonSendDataToServer = document.createElement('button');
  divMakingNewProject.appendChild(inputNameProject);
  divMakingNewProject.appendChild(buttonSendDataToServer);
  inputNameProject.placeholder = 'Enter name of your new Project';
  buttonSendDataToServer.textContent = 'Create Project';
  buttonSendDataToServer.addEventListener('click', ()=>{createProject(inputNameProject.value, ()=>{showPanelForAddingDependencies(inputNameProject.value); addWorkPlace()})});
  document.body.appendChild(divMakingNewProject);
}
function showPanelForAddingDependencies(nameProject){
  let divAddingDependencies = document.createElement('div');
  let divDependencies = document.createElement('div');
  let variableDependencies = document.createElement('input');
  let inputDependencies = document.createElement('input');
  let buttonAddingDependencies = document.createElement('button');
  divAddingDependencies.appendChild(variableDependencies);
  divAddingDependencies.appendChild(inputDependencies);
  divAddingDependencies.appendChild(buttonAddingDependencies);
  divAddingDependencies.appendChild(divDependencies);
  inputDependencies.placeholder = 'Enter dependency';
  buttonAddingDependencies.textContent = 'Add to Project';
  buttonAddingDependencies.addEventListener('click', ()=>{addDependency(inputDependencies.value, nameProject, variableDependencies.value, (response)=>{
    let newDependency = document.createElement('div');
    let newDependencyCode = document.createElement('p');
    newDependencyCode.textContent += `let ${variableDependencies.value} = '${inputDependencies.value}';`;
    newDependency.appendChild(newDependencyCode);
    divDependencies.appendChild(newDependency);
    //adding scripttag
    let modules = response.data;
    let moduleScript = document.createElement('script');
    moduleScript.defer = true;
    moduleScript.text = `let ${variableDependencies.value}req = ${modules}; let ${variableDependencies.value} = ${variableDependencies.value}req('${inputDependencies.value}');`;
    document.body.appendChild(moduleScript);
    moduleScript.addEventListener('load', console.log('added'))
    variableDependencies.value = "";
    inputDependencies.value = "";
  })});
  document.body.appendChild(divAddingDependencies);
}
function addWorkPlace(){
  let divBody = document.createElement('div');
  let divSample = document.createElement('div');
  let divMyDiagram = document.createElement('div');
  let textAreaEditor = document.createElement('textarea');
  let buttonSave = document.createElement('button');
  let buttonAddFunc = document.createElement('button');

  divSample.id = 'sample';
  divMyDiagram.id = 'myDiagramDiv';
  textAreaEditor.id = 'mySavedModel';
  buttonSave.id = 'SaveButton';
  buttonAddFunc.id = 'addFunc';

  divMyDiagram.setAttribute('style', 'width:600px; height:500px; border:1px solid black');
  textAreaEditor.setAttribute('style', 'width:100%;height:250px');

  buttonSave.textContent = 'Save';
  buttonAddFunc.textContent = 'Add Function';

  divSample.appendChild(divMyDiagram);
  divSample.appendChild(textAreaEditor);
  divSample.appendChild(buttonSave);
  divSample.appendChild(buttonAddFunc);
  divBody.appendChild(divSample);
  document.body.appendChild(divBody);  
  
  buttonSave.addEventListener('click', ()=>{save()});
  buttonAddFunc.addEventListener('click', ()=>{addFunc.call(addFunc)});
  divBody.onload = init();
}

function createProject(nameProject, callback){
  if(!nameProject){
    console.log('Enter Name');
  } else {
    axios({
      method:'post',
      url:'http://localhost/newProject',
      data: {name: nameProject}
    }).then((response)=>{
      callback(response);
    })
  }
}
function addDependency(nameDependency, nameProject, variableDependency, callback){
  if(!nameDependency){
    console.log('Enter dependency');
  } else {
    axios({
      method:'post',
      url:'http://localhost/addDependency',
      data: {nameDependency, nameProject, variableDependency}
    }).then((response)=>{
      callback(response);
    })
  }
}