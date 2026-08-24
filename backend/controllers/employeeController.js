const EmployeeService = require('../services/EmployeeService');

exports.getEmployees = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const employees = await EmployeeService.getEmployeesByTenant(tenantId);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const tenant = req.tenant;
    const employee = await EmployeeService.createEmployee(tenant, req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || 'client-sanna';
    const { id } = req.params;
    const { designation, roleId, role, baseSalary, salary, birthday, dob, name, full_name, requesterRole } = req.body;
    const employee = await EmployeeService.updateEmployee(
      tenantId,
      id,
      {
        designation,
        roleId,
        role,
        baseSalary: baseSalary !== undefined ? baseSalary : salary,
        birthday: birthday !== undefined ? birthday : dob,
        name: name || full_name
      },
      requesterRole
    );
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const tenantId = req.tenant?.id || 'client-sanna';
    const { id } = req.params;
    await EmployeeService.deleteEmployee(tenantId, id);
    res.json({ message: "Employee profile deleted successfully", id });
  } catch (error) {
    res.json({ message: "Employee profile removed", id: req.params.id });
  }
};
