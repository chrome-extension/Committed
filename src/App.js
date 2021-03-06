import React, { Component } from 'react';
import $ from "jquery";
import './css/App.css';
import './css/ColorThemes.css';
import TodoList from './components/TodoList';
import CalendarModal from './components/modals/CalendarModal';
import SideMenu from './components/SideMenu';
import BurgerButton from './components/buttons/BurgerButton';
import Sidebar from 'react-sidebar';
/* global chrome */

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      counter: localStorage.getItem('counter') || 0,
      todos: JSON.parse(localStorage.getItem('todos')) || [],
      displayMode: 'SHOW ALL',
      calendarModalForTaskId: 0,
      showCalendar: false,
      themeNumber: localStorage.getItem('themeNumber') || 'theme-0',
      sidebarOpen: false
    }
    console.log('Loaded default state');

    // initialize state
    var todos;
    var counter;
    var themeNumber;
    const self = this;
    chrome.storage.sync.get(['todos', 'counter', 'themeNumber'], function(result){
      todos = result.todos || JSON.parse(localStorage.getItem('todos')) || [];
      counter = result.counter || localStorage.getItem('counter') || 0;
      themeNumber = result.themeNumber || localStorage.getItem('themeNumber') || 'theme-0';

      console.log('Retrieved todos from chrome storage:', todos);
      console.log('Retrieved todos from chrome storage:', counter);
      console.log('Retrieved todos from chrome storage:', themeNumber);

      var timeNow = new Date();
      console.log('timeNow.toDateString()', timeNow.toDateString());
      // remove completed one-time todos
      for(var i=0; i<todos.length; i++){
        // check if the todo is repeating, i.e. one-time
        var isRepeating = false;
        for(var j=0; j<todos[i].daysOfWeek.length; j++){
          if(todos[i].daysOfWeek[j]){
            isRepeating = true;
            break;
          }
        }
        if(!isRepeating && todos[i].completed && todos[i].dayCompleted !== timeNow.toDateString()){
          todos.splice(i,1);
          i--;
          continue;
        }
        if(!isRepeating && !todos[i].completed){
          todos[i].render = true;
        }
        if(isRepeating){
          todos[i].render = true;
        }
      }
      self.setState({
        counter,
        todos,
        displayMode: 'SHOW ALL',
        calendarModalForTaskId: 0,
        showCalendar: false,
        themeNumber,
        sidebarOpen: false
      });
      localStorage.setItem('todos', JSON.stringify(todos));
      chrome.storage.sync.set({'todos': todos}, function() {
        // Notify that we saved.
        console.log('Saved todos to chrome storage');
      });

    })

  }

  createNewTask(taskName){
    var timeNow = new Date();
    var newTodo = {
      id: this.state.counter,
      name: taskName,
      daysOfWeek: [false, false, false, false, false, false, false],
      completed: false,
      dayCompleted: timeNow.toDateString(),
      render: true,
      editing: false,
      dueDate: null
    }

    var newTodoList = this.state.todos.slice(0);
    newTodoList.push(newTodo);

    // save results
    localStorage.setItem('todos', JSON.stringify(newTodoList));
    localStorage.setItem('counter', parseInt(this.state.counter, 10) + 1);
    chrome.storage.sync.set({'todos': newTodoList}, function() {
      // Notify that we saved.
      console.log('Saved todos to chrome storage');
    });
    chrome.storage.sync.set({'counter': parseInt(this.state.counter, 10) + 1}, function() {
      // Notify that we saved.
      console.log('Saved counter to chrome storage');
    });
    this.setState({
      counter: parseInt(this.state.counter, 10) + 1,
      todos: newTodoList
    })
  }

  updateTaskList(newTodoList){
    this.setState({
      todos: newTodoList
    })
    localStorage.setItem('todos', JSON.stringify(newTodoList));
    chrome.storage.sync.set({'todos': newTodoList}, function() {
      // Notify that we saved.
      console.log('Saved todos to Chrome storage');
    });
  }

  toggleTaskCompletion(taskId){
    let newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      if(newTodoList[i].id===taskId){
        var timeNow = new Date();
        newTodoList[i].completed = !newTodoList[i].completed;
        newTodoList[i].dayCompleted = timeNow.toDateString();
        break;
      }
    }
    this.updateTaskList(newTodoList);
  }

  toggleDayOfWeek(taskId, dayOfWeek){
    let newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      if(newTodoList[i].id===taskId){
        newTodoList[i].daysOfWeek[dayOfWeek] = !newTodoList[i].daysOfWeek[dayOfWeek];
        break;
      }
    }
    this.updateTaskList(newTodoList);
  }

  deleteTask(taskId){
    var newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      if(newTodoList[i].id===taskId){
        newTodoList.splice(i,1);
        break;
      }
    }
    this.updateTaskList(newTodoList);
  }

  // deleteAllTask(){
  //   localStorage.clear();
  //   this.setState({
  //     counter: 0,
  //     todos: [],
  //     editing: false
  //   })
  // }

  startEditMode(taskId){
    this.setState({
      editing: true
    })
    var newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      if(newTodoList[i].id===taskId){
        newTodoList[i].editing = true;
      } else {
        newTodoList[i].editing = false;
      }
    }
    this.updateTaskList(newTodoList);
  }

  endEditMode(taskId, newName){
    this.setState({
      editing: false
    })
    var newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      newTodoList[i].editing = false;
      if(newTodoList[i].id===taskId){
        newTodoList[i].name = newName;
      }
    }
    this.updateTaskList(newTodoList);
  }

  toggleShowAll(){
    var todos = this.state.todos;

    switch(this.state.displayMode){
      case 'SHOW ALL': // switch to SHOW TODAY
        const timeNow = new Date();
        for(var i=0; i<todos.length; i++){
          if(todos[i].daysOfWeek[timeNow.getDay()]){
            todos[i].render = true;
          } else {
            todos[i].render = false;
          }

        }
        this.setState({
          displayMode: 'SHOW TODAY',
          todos
        })
      break;

      case 'SHOW TODAY': // switch to SHOW DUEDATES
        for(var i=0; i<todos.length; i++){
          if(todos[i].dueDate){
            todos[i].render = true;
          } else {
            todos[i].render = false;
          }

        }
        this.setState({
          displayMode: 'SHOW DUEDATES',
          todos
        })
      break;

      case 'SHOW DUEDATES': // switch to SHOW ALL
        for(var i=0; i<todos.length; i++){
          todos[i].render = true;
        }
        this.setState({
          displayMode: 'SHOW ALL',
          todos
        })
      break;

      default:
        alert('error in toggle show, resorting to show all')
        for(var i=0; i<todos.length; i++){
          todos[i].render = true;
        }
        this.setState({
          displayMode: 'SHOW ALL',
          todos
        })
      break;
    }
  }

  // Calendar
  handleOpenCalendar(taskId){
    this.setState({
      showCalendar: true,
      calendarModalForTaskId: taskId
    })
  }

  handleCloseCalendar(){
    this.setState({
      showCalendar: false,
      calendarModalForTaskId: -1
    })
  }

  selectDueDate(dueDate){
    let newTodoList = this.state.todos;
    for(var i=0; i<newTodoList.length; i++){
      if(newTodoList[i].id === this.state.calendarModalForTaskId){
        if(!dueDate){
          newTodoList[i].dueDate = null;
        } else {
          newTodoList[i].dueDate = String(dueDate.getTime());
        }
        break;
      }
    }
    this.updateTaskList(newTodoList);
    this.handleCloseCalendar();
  }

  handleSelectTheme(theme){
    this.setState({
      themeNumber: theme
    })
    localStorage.setItem('themeNumber', theme);
    chrome.storage.sync.set({'themeNumber': theme}, function() {
      // Notify that we saved.
      console.log('Saved themeNumber to Chrome storage');
    });
  }

  onSetSidebarOpen() {
    // burger button credits to: https://codepen.io/keenode/pen/dPqdPd?editors=1010
    var clickDelay = 500,
        clickDelayTimer = null;

    if(clickDelayTimer === null) {

      var $burger = $('.burger-click-region');
      $burger.toggleClass('active');
      $burger.parent().toggleClass('is-open');

      if(!$burger.hasClass('active')) {
        $burger.addClass('closing');
      }

      clickDelayTimer = setTimeout(function () {
        $burger.removeClass('closing');
        clearTimeout(clickDelayTimer);
        clickDelayTimer = null;
      }, clickDelay);
    }

    this.setState({sidebarOpen: !this.state.sidebarOpen})
  }

  render() {
    const sideMenuStyle = {
      root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      },
      sidebar: {
        zIndex: 2,
        position: 'absolute',
        top: 0,
        bottom: 0,
        transition: 'transform .3s ease-out',
        WebkitTransition: '-webkit-transform .3s ease-out',
        willChange: 'transform',
        overflowY: 'auto',
      },
      content: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
        transition: 'left .3s ease-out, right .3s ease-out',
      },
      overlay: {
        zIndex: 1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity .3s ease-out, visibility .3s ease-out',
        backgroundColor: 'rgba(0,0,0,.3)',
      },
      dragHandle: {
        zIndex: 1,
        position: 'fixed',
        top: 0,
        bottom: 0,
      },
    };

    return (
      <Sidebar
        sidebar={
          <SideMenu
            toggleShowAll={this.toggleShowAll.bind(this)}
            displayMode={this.state.displayMode}
            handleSelectTheme={this.handleSelectTheme.bind(this)}
          />
        }
        docked={this.state.sidebarOpen}
        styles={sideMenuStyle}
      >
               <div className={this.state.themeNumber + " App"}>

                 <button
                   className="toggle-showall-button"
                   onClick={this.toggleShowAll.bind(this)}
                 >
                   {this.state.displayMode}
                 </button>

                 <div className="button-containers">
                   {/* burger button */}
                   <BurgerButton
                     onSetSidebarOpen={this.onSetSidebarOpen.bind(this)}
                   />
                 </div>


                 <CalendarModal
                   handleOpenCalendar={this.handleOpenCalendar.bind(this)}
                   handleCloseCalendar={this.handleCloseCalendar.bind(this)}
                   showCalendar={this.state.showCalendar}
                   selectDueDate={this.selectDueDate.bind(this)}
                 />

                 <TodoList
                   editing={this.state.editing}
                   todos={this.state.todos}
                   updateTaskList={this.updateTaskList.bind(this)}
                   toggleTaskCompletion={this.toggleTaskCompletion.bind(this)}
                   toggleDayOfWeek={this.toggleDayOfWeek.bind(this)}
                   createNewTask={this.createNewTask.bind(this)}
                   deleteTask={this.deleteTask.bind(this)}
                   startEditMode={this.startEditMode.bind(this)}
                   endEditMode={this.endEditMode.bind(this)}
                   handleOpenCalendar={this.handleOpenCalendar.bind(this)}
                 />
               </div>
      </Sidebar>
    );
  }
}

export default App;
