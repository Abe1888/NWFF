'use client';

import React, { useState, memo } from 'react';
import { 
  Play, CheckCircle2, AlertTriangle, Clock, Database, 
  Truck, Users, Target, MapPin, RefreshCw, Bug 
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  error?: string;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
}

const TestingPanel: React.FC = memo(() => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runDatabaseTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    
    // Test 1: Database Connection
    const connectionStart = Date.now();
    try {
      const { error } = await supabase.from('vehicles').select('count').limit(1);
      tests.push({
        name: 'Database Connection',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to connect to database' : 'Successfully connected to database',
        duration: Date.now() - connectionStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Database Connection',
        status: 'failed',
        message: 'Database connection failed',
        duration: Date.now() - connectionStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 2: Vehicle Data Retrieval
    const vehicleStart = Date.now();
    try {
      const { data, error } = await supabase.from('vehicles').select('*').limit(5);
      tests.push({
        name: 'Vehicle Data Retrieval',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to retrieve vehicles' : `Retrieved ${data?.length || 0} vehicles`,
        duration: Date.now() - vehicleStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Vehicle Data Retrieval',
        status: 'failed',
        message: 'Vehicle data retrieval failed',
        duration: Date.now() - vehicleStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 3: Location Data Retrieval
    const locationStart = Date.now();
    try {
      const { data, error } = await supabase.from('locations').select('*');
      tests.push({
        name: 'Location Data Retrieval',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to retrieve locations' : `Retrieved ${data?.length || 0} locations`,
        duration: Date.now() - locationStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Location Data Retrieval',
        status: 'failed',
        message: 'Location data retrieval failed',
        duration: Date.now() - locationStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 4: Team Member Data Retrieval
    const teamStart = Date.now();
    try {
      const { data, error } = await supabase.from('team_members').select('*');
      tests.push({
        name: 'Team Member Data Retrieval',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to retrieve team members' : `Retrieved ${data?.length || 0} team members`,
        duration: Date.now() - teamStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Team Member Data Retrieval',
        status: 'failed',
        message: 'Team member data retrieval failed',
        duration: Date.now() - teamStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 5: Task Data Retrieval
    const taskStart = Date.now();
    try {
      const { data, error } = await supabase.from('tasks').select('*').limit(10);
      tests.push({
        name: 'Task Data Retrieval',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to retrieve tasks' : `Retrieved ${data?.length || 0} tasks`,
        duration: Date.now() - taskStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Task Data Retrieval',
        status: 'failed',
        message: 'Task data retrieval failed',
        duration: Date.now() - taskStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    return tests;
  };

  const runCRUDTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];
    const testVehicleId = `TEST-${Date.now()}`;

    // Test 1: Create Operation
    const createStart = Date.now();
    try {
      const { error } = await supabase
        .from('vehicles')
        .insert({
          id: testVehicleId,
          type: 'Test Vehicle',
          location: 'Test Location',
          day: 99,
          time_slot: '00:00-00:01',
          status: 'Pending',
          gps_required: 1,
          fuel_sensors: 1,
          fuel_tanks: 1
        });
      
      tests.push({
        name: 'Create Vehicle Record',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to create test vehicle' : 'Successfully created test vehicle',
        duration: Date.now() - createStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Create Vehicle Record',
        status: 'failed',
        message: 'Create operation failed',
        duration: Date.now() - createStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 2: Read Operation
    const readStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', testVehicleId)
        .single();
      
      tests.push({
        name: 'Read Vehicle Record',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to read test vehicle' : 'Successfully read test vehicle',
        duration: Date.now() - readStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Read Vehicle Record',
        status: 'failed',
        message: 'Read operation failed',
        duration: Date.now() - readStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 3: Update Operation
    const updateStart = Date.now();
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: 'In Progress' })
        .eq('id', testVehicleId);
      
      tests.push({
        name: 'Update Vehicle Record',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to update test vehicle' : 'Successfully updated test vehicle',
        duration: Date.now() - updateStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Update Vehicle Record',
        status: 'failed',
        message: 'Update operation failed',
        duration: Date.now() - updateStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 4: Delete Operation
    const deleteStart = Date.now();
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', testVehicleId);
      
      tests.push({
        name: 'Delete Vehicle Record',
        status: error ? 'failed' : 'passed',
        message: error ? 'Failed to delete test vehicle' : 'Successfully deleted test vehicle',
        duration: Date.now() - deleteStart,
        error: error?.message
      });
    } catch (err) {
      tests.push({
        name: 'Delete Vehicle Record',
        status: 'failed',
        message: 'Delete operation failed',
        duration: Date.now() - deleteStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    return tests;
  };

  const runDataIntegrityTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: Vehicle-Location Consistency
    const locationConsistencyStart = Date.now();
    try {
      const { data: vehicles } = await supabase.from('vehicles').select('location');
      const { data: locations } = await supabase.from('locations').select('name');
      
      const vehicleLocations = new Set(vehicles?.map((v: any) => v.location) || []);
      const definedLocations = new Set(locations?.map((l: any) => l.name) || []);
      const missingLocations = Array.from(vehicleLocations).filter((loc: any) => !definedLocations.has(loc));
      
      tests.push({
        name: 'Vehicle-Location Consistency',
        status: missingLocations.length === 0 ? 'passed' : 'failed',
        message: missingLocations.length === 0 
          ? 'All vehicle locations are properly defined' 
          : `${missingLocations.length} undefined locations found`,
        duration: Date.now() - locationConsistencyStart,
        error: missingLocations.length > 0 ? `Missing locations: ${missingLocations.join(', ')}` : undefined
      });
    } catch (err) {
      tests.push({
        name: 'Vehicle-Location Consistency',
        status: 'failed',
        message: 'Location consistency check failed',
        duration: Date.now() - locationConsistencyStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 2: Task-Vehicle Reference Integrity
    const taskVehicleStart = Date.now();
    try {
      const { data: tasks } = await supabase.from('tasks').select('vehicle_id');
      const { data: vehicles } = await supabase.from('vehicles').select('id');
      
      const taskVehicleIds = new Set(tasks?.map((t: any) => t.vehicle_id) || []);
      const vehicleIds = new Set(vehicles?.map((v: any) => v.id) || []);
      const invalidRefs = Array.from(taskVehicleIds).filter((id: any) => !vehicleIds.has(id));
      
      tests.push({
        name: 'Task-Vehicle Reference Integrity',
        status: invalidRefs.length === 0 ? 'passed' : 'failed',
        message: invalidRefs.length === 0 
          ? 'All task-vehicle references are valid' 
          : `${invalidRefs.length} invalid vehicle references found`,
        duration: Date.now() - taskVehicleStart,
        error: invalidRefs.length > 0 ? `Invalid references: ${invalidRefs.join(', ')}` : undefined
      });
    } catch (err) {
      tests.push({
        name: 'Task-Vehicle Reference Integrity',
        status: 'failed',
        message: 'Task-vehicle reference check failed',
        duration: Date.now() - taskVehicleStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test 3: Data Type Validation
    const dataTypeStart = Date.now();
    try {
      const { data: vehicles } = await supabase.from('vehicles').select('day, gps_required, fuel_sensors, fuel_tanks');
      
      let invalidData = 0;
      vehicles?.forEach((vehicle: any) => {
        if (vehicle.day < 1 || vehicle.day > 14) invalidData++;
        if (vehicle.gps_required < 0) invalidData++;
        if (vehicle.fuel_sensors < 0) invalidData++;
        if (vehicle.fuel_tanks < 0) invalidData++;
        if (vehicle.fuel_sensors > vehicle.fuel_tanks) invalidData++;
      });
      
      tests.push({
        name: 'Data Type Validation',
        status: invalidData === 0 ? 'passed' : 'failed',
        message: invalidData === 0 
          ? 'All data types and ranges are valid' 
          : `${invalidData} data validation issues found`,
        duration: Date.now() - dataTypeStart,
        error: invalidData > 0 ? 'Some vehicles have invalid day, GPS, or fuel sensor values' : undefined
      });
    } catch (err) {
      tests.push({
        name: 'Data Type Validation',
        status: 'failed',
        message: 'Data type validation failed',
        duration: Date.now() - dataTypeStart,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    return tests;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestSuites([]);

    const suites: TestSuite[] = [
      {
        name: 'Database Operations',
        description: 'Test basic database connectivity and data retrieval',
        tests: []
      },
      {
        name: 'CRUD Operations',
        description: 'Test Create, Read, Update, Delete operations',
        tests: []
      },
      {
        name: 'Data Integrity',
        description: 'Test data consistency and referential integrity',
        tests: []
      }
    ];

    // Initialize test suites with pending status
    suites.forEach(suite => {
      suite.tests = [
        { name: 'Initializing...', status: 'pending', message: 'Preparing tests...' }
      ];
    });
    setTestSuites([...suites]);

    try {
      // Run Database Tests
      setCurrentTest('Database Operations');
      const dbTests = await runDatabaseTests();
      suites[0].tests = dbTests;
      setTestSuites([...suites]);

      // Run CRUD Tests
      setCurrentTest('CRUD Operations');
      const crudTests = await runCRUDTests();
      suites[1].tests = crudTests;
      setTestSuites([...suites]);

      // Run Data Integrity Tests
      setCurrentTest('Data Integrity');
      const integrityTests = await runDataIntegrityTests();
      suites[2].tests = integrityTests;
      setTestSuites([...suites]);

    } catch (error) {
      console.error('Test execution failed:', error);
    }

    setCurrentTest(null);
    setIsRunning(false);
  };

  const getTestIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTestColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getTotalStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    return {
      total: allTests.length,
      passed: allTests.filter(t => t.status === 'passed').length,
      failed: allTests.filter(t => t.status === 'failed').length,
      pending: allTests.filter(t => t.status === 'pending').length
    };
  };

  const stats = getTotalStats();

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">System Testing</h3>
              <p className="text-sm text-slate-600">Automated testing for API endpoints and data integrity</p>
            </div>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Test Progress */}
        {isRunning && currentTest && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Running: {currentTest}</h4>
                <p className="text-xs text-blue-700">Please wait while tests are executing...</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Statistics */}
        {stats.total > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="text-lg font-semibold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-600">Total Tests</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
              <div className="text-lg font-semibold text-green-800">{stats.passed}</div>
              <div className="text-xs text-green-600">Passed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-md border border-red-200">
              <div className="text-lg font-semibold text-red-800">{stats.failed}</div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="text-lg font-semibold text-slate-800">{stats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
          </div>
        )}

        {/* Test Suites */}
        <div className="space-y-6">
          {testSuites.length === 0 ? (
            <div className="text-center py-8">
              <Bug className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Test</h3>
              <p className="text-slate-600">Click "Run All Tests" to start automated testing</p>
            </div>
          ) : (
            testSuites.map((suite, suiteIndex) => (
              <div key={suiteIndex} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-base font-semibold text-slate-900">{suite.name}</h4>
                  <p className="text-sm text-slate-600">{suite.description}</p>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {suite.tests.map((test, testIndex) => (
                      <div
                        key={testIndex}
                        className={`rounded-lg p-3 border ${getTestColor(test.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTestIcon(test.status)}
                            <div>
                              <span className="text-sm font-medium text-slate-900">{test.name}</span>
                              <p className="text-xs text-slate-600">{test.message}</p>
                            </div>
                          </div>
                          
                          {test.duration && (
                            <span className="text-xs text-slate-500">{test.duration}ms</span>
                          )}
                        </div>
                        
                        {test.error && (
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-slate-600">
                            <span className="font-medium">Error:</span> {test.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

TestingPanel.displayName = 'TestingPanel';

export default TestingPanel;