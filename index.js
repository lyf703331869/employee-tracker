// Dependencies
const inquirer = require("inquirer");
const mysql = require("mysql2");
const cTable = require("console.table");
const figlet = require("figlet");
require("dotenv").config();

const PORT = process.env.PORT || 3001;

console.log(
  figlet.textSync("\nEmployee\nTracker", {
    font: "Ghost",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
    whitespaceBreak: true,
  })
);

// Connect to database
const db = mysql.createConnection(
  {
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  console.log(`Connected to the employees_db database.`)
);

function start() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "list",
        message: "What would you like to do?",
        default: "Use arrow keys",
        choices: [
          "View All Employees",
          "View All Employees By Department",
          "View All Employees By Manager",
          "Add Employee",
          "Remove Employee",
          "Update Employee Role",
          "View All Role",
          "Add Role",
          "Remove Role",
          "Update Role Salary",
          "View All Department",
          "Add Department",
          "Remove Department",
          "View The Total Utilized Budget Of A Department",
          "Quit",
        ],
      },
    ])
    .then((userChoice) => {
      switch (userChoice.list) {
        case "View All Employees":
          let sql = `SELECT employee.id, employee.first_name, employee.last_name,role.title, department.name as department, role.salary, CONCAT(manager.first_name , ' ' , manager.last_name) as "manager" FROM department JOIN role ON department.id = role.department_id JOIN employee ON role.id = employee.role_id LEFT JOIN employee manager ON employee.manager_id = manager.id ORDER BY employee.id ASC;`;
          db.query(sql, (err, result) => {
            if (err) {
              console.log(err);
            }
            console.log("\n");
            console.table(result);
            start();
          });
          break;
        case "View All Employees By Department":
          db.query("SELECT * FROM department", (err, res) => {
            if (err) throw err;
            let depOption = [];
            for (let i = 0; i < res.length; i++) {
              depOption.push(res[i].name);
            }
            inquirer
              .prompt([
                {
                  type: "list",
                  name: "department",
                  message:
                    "Which department would you like to see employees for?",
                  default: "Use arrow keys",
                  choices: depOption,
                },
              ])
              .then((userChoice) => {
                let depId;
                let depName;
                for (let i = 0; i < res.length; i++) {
                  depName = res[i].name;
                  if (depName === userChoice.department) {
                    depId = res[i].id;
                  }
                }
                let sql = `SELECT employee.id, employee.first_name, employee.last_name,role.title FROM role JOIN employee ON role.id = employee.role_id && role.department_id=${depId};`;
                db.query(sql, depId, (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  console.log("\n");
                  console.table(result);
                  start();
                });
              });
          });
          break;
        case "View All Employees By Manager":
          let sqlQuery = `SELECT employee.id, employee.first_name, employee.last_name FROM employee`;
          let fullName = [];
          db.query(sqlQuery, function (err, res) {
            if (err) throw err;
            res.map((element, i) => {
              fullName.push(element.first_name + " " + element.last_name);
            });

            inquirer
              .prompt([
                {
                  type: "list",
                  name: "manager",
                  message:
                    "Which employee do you want to see direct reports for?",
                  default: "Use arrow keys",
                  choices: fullName,
                },
              ])
              .then((userChoice) => {
                for (let i = 0; i < res.length; i++) {
                  let resFullName = res[i].first_name + " " + res[i].last_name;
                  if (resFullName === userChoice.manager) {
                    let sql = `SELECT employee.id, employee.first_name, employee.last_name,role.title FROM role JOIN employee ON role.id = employee.role_id && employee.manager_id = ${res[i].id} && employee.id != ${res[i].id};`;
                    db.query(sql, (err, result) => {
                      if (err) {
                        console.log(err);
                      }
                      console.log("\n");
                      console.table(result);
                      start();
                    });
                    return;
                  }
                }
              });
          });
          break;
        case "Add Employee":
          db.query("SELECT * FROM role", (err, roleRes) => {
            if (err) throw err;
            let roleOptions = [];
            for (let i = 0; i < roleRes.length; i++) {
              roleOptions.push(roleRes[i].title);
            }
            db.query("SELECT * FROM employee", (err, empRes) => {
              if (err) throw err;
              let empOptions = [];
              for (let i = 0; i < empRes.length; i++) {
                empOptions.push(
                  empRes[i].first_name + " " + empRes[i].last_name
                );
              }
              inquirer
                .prompt([
                  {
                    type: "input",
                    name: "firstName",
                    message: "What is the employee's first name?",
                    validate: (response) => {
                      if (response) {
                        return true;
                      } else {
                        console.log("Cannot be blank.");
                      }
                    },
                  },
                  {
                    type: "input",
                    name: "lastName",
                    message: "What is the employee's last name?",
                    validate: (response) => {
                      if (response) {
                        return true;
                      } else {
                        console.log("Cannot be blank.");
                      }
                    },
                  },
                  {
                    type: "list",
                    name: "role",
                    message: "What is the employee's role?",
                    default: "Use arrow keys",
                    choices: roleOptions,
                  },
                  {
                    type: "list",
                    name: "manager",
                    message: "What is the employee's manager?",
                    default: "Use arrow keys",
                    choices: empOptions,
                  },
                ])
                .then((userChoice) => {
                  let roleId;
                  for (let i = 0; i < roleRes.length; i++) {
                    if (roleRes[i].title === userChoice.role) {
                      roleId = roleRes[i].id;
                    }
                  }
                  let managerId;
                  for (let i = 0; i < empRes.length; i++) {
                    if (
                      `${empRes[i].first_name} ${empRes[i].last_name}` ===
                      userChoice.manager
                    ) {
                      managerId = empRes[i].id;
                    }
                  }
                  db.query(
                    `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("${userChoice.firstName}", "${userChoice.lastName}",${roleId}, ${managerId})`,
                    (err) => {
                      if (err) throw err;
                      console.log("\nNew employee has been added!\n");
                      start();
                    }
                  );
                });
            });
          });
          break;
        case "Remove Employee":
          db.query("SELECT * FROM employee", (err, empRes) => {
            if (err) throw err;
            let empOptions = [];
            for (let i = 0; i < empRes.length; i++) {
              empOptions.push(empRes[i].first_name + " " + empRes[i].last_name);
            }
            inquirer
              .prompt([
                {
                  type: "list",
                  name: "employee",
                  message: "Which employee do you want to remove?",
                  default: "Use arrow keys",
                  choices: empOptions,
                },
              ])
              .then((userChoice) => {
                let empId;
                let empName;
                for (let i = 0; i < empRes.length; i++) {
                  empName = empRes[i].first_name + " " + empRes[i].last_name;
                  if (empName === userChoice.employee) {
                    empId = empRes[i].id;
                  }
                }
                db.query("DELETE FROM employee WHERE id = ?", empId, (err) => {
                  if (err) throw err;
                  console.log("\nEmployee has been removed!\n");
                  start();
                });
              });
          });
          break;
        case "Update Employee Role":
          db.query("SELECT * FROM role", (err, roleRes) => {
            if (err) throw err;
            let roleOptions = [];
            for (let i = 0; i < roleRes.length; i++) {
              roleOptions.push(roleRes[i].title);
            }
            db.query("SELECT * FROM employee", (err, empRes) => {
              if (err) throw err;
              let empOptions = [];
              for (let i = 0; i < empRes.length; i++) {
                empOptions.push(
                  empRes[i].first_name + " " + empRes[i].last_name
                );
              }
              inquirer
                .prompt([
                  {
                    type: "list",
                    name: "employee",
                    message: "Which employee do you want to update?",
                    default: "Use arrow keys",
                    choices: empOptions,
                  },
                  {
                    type: "list",
                    name: "role",
                    message: "Which role you want to assign this employee to?",
                    default: "Use arrow keys",
                    choices: roleOptions,
                  },
                  {
                    type: "list",
                    name: "manager",
                    message: "What is the employee's manager now?",
                    default: "Use arrow keys",
                    choices: empOptions,
                  },
                ])
                .then((userChoice) => {
                  let empId;
                  let empName;
                  for (let i = 0; i < empRes.length; i++) {
                    empName = empRes[i].first_name + " " + empRes[i].last_name;
                    if (empName === userChoice.employee) {
                      empId = empRes[i].id;
                    }
                  }
                  let roleId;
                  for (let i = 0; i < roleRes.length; i++) {
                    if (roleRes[i].title === userChoice.role) {
                      roleId = roleRes[i].id;
                    }
                  }
                  let managerId;
                  for (let i = 0; i < empRes.length; i++) {
                    if (
                      `${empRes[i].first_name} ${empRes[i].last_name}` ===
                      userChoice.manager
                    ) {
                      managerId = empRes[i].id;
                    }
                  }
                  db.query(
                    `UPDATE employee SET role_id = ${roleId}, manager_id = ${managerId} WHERE id = ${empId}`,
                    (err) => {
                      if (err) throw err;
                      console.log("\nEmployee has been updated!\n");
                      start();
                    }
                  );
                });
            });
          });
          break;
        case "View All Role":
          db.query(
            "SELECT role.id, role.title, department.name as department, role.salary FROM role JOIN department ON role.department_id = department.id",
            (err, result) => {
              if (err) throw err;
              console.log("\n");
              console.table(result);
              start();
            }
          );
          break;
        case "Add Role":
          db.query("SELECT * FROM department;", (err, depRes) => {
            if (err) throw err;
            let depOptions = [];
            for (let i = 0; i < depRes.length; i++) {
              depOptions.push(depRes[i].name);
            }
            inquirer
              .prompt([
                {
                  type: "input",
                  name: "title",
                  message: "What is the role's title?",
                  validate: (response) => {
                    if (response) {
                      return true;
                    } else {
                      console.log("Cannot be blank.");
                    }
                  },
                },
                {
                  type: "input",
                  name: "salary",
                  message: "What is the role's salary?",
                  validate: (response) => {
                    if (response) {
                      return true;
                    } else {
                      console.log("Cannot be blank.");
                    }
                  },
                },
                {
                  type: "list",
                  name: "department",
                  message: "What is the role's department?",
                  default: "Use arrow keys",
                  choices: depOptions,
                },
              ])
              .then((userChoice) => {
                let depId;
                for (let i = 0; i < depRes.length; i++) {
                  if (depRes[i].name === userChoice.department) {
                    depId = depRes[i].id;
                  }
                }
                db.query(
                  `INSERT INTO role (title, salary, department_id) VALUES ("${userChoice.title}", "${userChoice.salary}",${depId})`,
                  (err) => {
                    if (err) throw err;
                    console.log("\nNew role has been added!\n");
                    start();
                  }
                );
              });
          });
          break;
        case "Remove Role":
          db.query("SELECT * FROM role", (err, roleRes) => {
            if (err) throw err;
            let roleOptions = [];
            for (let i = 0; i < roleRes.length; i++) {
              roleOptions.push(roleRes[i].title);
            }
            inquirer
              .prompt([
                {
                  type: "list",
                  name: "role",
                  message: "Which role do you want to remove?",
                  default: "Use arrow keys",
                  choices: roleOptions,
                },
              ])
              .then((userChoice) => {
                let roleId;
                let roleName;
                for (let i = 0; i < roleRes.length; i++) {
                  roleName = roleRes[i].title;
                  if (roleName === userChoice.role) {
                    roleId = roleRes[i].id;
                  }
                }
                db.query("DELETE FROM role WHERE id = ?", roleId, (err) => {
                  if (err) throw err;
                  console.log("\nRole has been removed!\n");
                  start();
                });
              });
          });
          break;
        case "Update Role Salary":
          db.query("SELECT * FROM role", (err, roleRes) => {
            if (err) throw err;
            let roleOptions = [];
            for (let i = 0; i < roleRes.length; i++) {
              roleOptions.push(roleRes[i].title);
            }
            inquirer
              .prompt([
                {
                  type: "list",
                  name: "role",
                  message: "Which role do you want to update?",
                  default: "Use arrow keys",
                  choices: roleOptions,
                },
                {
                  type: "input",
                  name: "salary",
                  message: "How much the salary for this role?",
                  validate: (response) => {
                    if (response) {
                      return true;
                    } else {
                      console.log("Cannot be blank.");
                    }
                  },
                },
              ])
              .then((userChoice) => {
                let roleId;
                let roleName;
                for (let i = 0; i < roleRes.length; i++) {
                  roleName = roleRes[i].title;
                  if (roleName === userChoice.role) {
                    roleId = roleRes[i].id;
                  }
                }
                db.query(
                  `UPDATE role SET salary = ${userChoice.salary} WHERE id = ${roleId}`,
                  (err) => {
                    if (err) throw err;
                    console.log("\nRole salary has been updated!\n");
                    start();
                  }
                );
              });
          });
          break;
        case "View All Department":
          db.query("SELECT * FROM department", (err, result) => {
            if (err) throw err;
            console.log("\n");
            console.table(result);
            start();
          });
          break;
        case "Add Department":
          inquirer
            .prompt([
              {
                type: "input",
                name: "name",
                message: "What is the department's name?",
                validate: (response) => {
                  if (response) {
                    return true;
                  } else {
                    console.log("Cannot be blank.");
                  }
                },
              },
            ])
            .then((userChoice) => {
              db.query(
                `INSERT INTO department (name) VALUES ("${userChoice.name}")`,
                (err) => {
                  if (err) throw err;
                  console.log("\nNew department has been added!\n");
                  start();
                }
              );
            });
          break;
        case "Remove Department":
          db.query("SELECT * FROM department", (err, depRes) => {
            if (err) throw err;
            let depOptions = [];
            for (let i = 0; i < depRes.length; i++) {
              depOptions.push(depRes[i].name);
            }
            inquirer
              .prompt([
                {
                  type: "list",
                  name: "department",
                  message: "Which department do you want to remove?",
                  default: "Use arrow keys",
                  choices: depOptions,
                },
              ])
              .then((userChoice) => {
                let depId;
                for (let i = 0; i < depRes.length; i++) {
                  if (depRes[i].name === userChoice.department) {
                    depId = depRes[i].id;
                  }
                }
                db.query(
                  "DELETE FROM department WHERE id = ?",
                  depId,
                  (err) => {
                    if (err) throw err;
                    console.log("\nDepartment has been removed!\n");
                    start();
                  }
                );
              });
          });
          break;
        case "View The Total Utilized Budget Of A Department":
          db.query("SELECT * FROM department", (err, depRes) => {
            if (err) throw err;
            let depOptions = [];
            for (let i = 0; i < depRes.length; i++) {
              depOptions.push(depRes[i].name);
            }
            let sql = `SELECT employee.id, department.name as department, role.salary FROM department JOIN role ON department.id = role.department_id JOIN employee ON role.id = employee.role_id ORDER BY employee.id ASC;`;
            db.query(sql, (err, BudRes) => {
              if (err) {
                console.log(err);
              }
              inquirer
                .prompt([
                  {
                    type: "list",
                    name: "department",
                    message: "Which department do you want to check?",
                    default: "Use arrow keys",
                    choices: depOptions,
                  },
                ])
                .then((userChoice) => {
                  let totalBudget = 0;
                  for (let i = 0; i < BudRes.length; i++) {
                    if (BudRes[i].department === userChoice.department) {
                      totalBudget += parseInt(BudRes[i].salary);
                    }
                  }
                  console.log(
                    `\nThis department total utilized budget is $${totalBudget}.\n`
                  );
                  start();
                });
            });
          });
          break;
        case "Quit":
          console.log("Goodbye!");
          process.exit();
      }
    });
}

/*

 */

start();
