import type { BuiltinSkill } from "./types"

const playwrightSkill: BuiltinSkill = {
  name: "playwright",
  description: "Browser automation with Playwright MCP. Use for web scraping, testing, screenshots, and browser interactions.",
  template: `# Playwright Browser Automation

This skill provides browser automation capabilities via the Playwright MCP server.`,
  mcpConfig: {
    playwright: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  },
}

const systemverilogSkill: BuiltinSkill = {
  name: "systemverilog",
  description: "SystemVerilog RTL design following lowRISC coding style with Verilator verification. Use for hardware description, RTL modules, and testbenches.",
  agent: "rtl-engineer",
  template: `# SystemVerilog RTL Design Skill

This skill provides SystemVerilog RTL design capabilities following the lowRISC Verilog Coding Style Guide with project-specific modifications.

## Coding Style Overview

Based on [lowRISC Verilog Coding Style Guide](https://github.com/lowRISC/style-guides/blob/master/VerilogCodingStyle.md) with these modifications:

### Port Direction Convention
- **Default (lowRISC)**: Use suffixes \`_i\`, \`_o\`, \`_io\`
- **Alternative (on request)**: Use prefixes \`i_\`, \`o_\`, \`io_\`

### Reset Convention (MANDATORY)
**Always use active-low asynchronous reset**:
- Signal name: \`rst_n\`, \`rst_ni\` (suffix) or \`i_rst_n\` (prefix)
- Sensitivity: \`negedge rst_n\`
- Active when LOW, inactive (normal operation) when HIGH

\`\`\`systemverilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n) begin
    // Reset state
    reg_q <= '0;
  end else begin
    // Normal operation
    reg_q <= reg_d;
  end
end
\`\`\`

## Naming Conventions

| Construct | Style | Example |
|-----------|-------|---------|
| Modules, packages | \`lower_snake_case\` | \`my_fifo\`, \`axi_pkg\` |
| Instance names | \`u_<name>\` | \`u_fifo\`, \`u_arbiter\` |
| Parameters | \`UpperCamelCase\` | \`DataWidth\`, \`Depth\` |
| Constants | \`ALL_CAPS\` | \`MAX_COUNT\`, \`IDLE\` |
| Enum types | \`_e\` suffix | \`state_e\`, \`opcode_e\` |
| Typedefs | \`_t\` suffix | \`data_t\`, \`addr_t\` |
| Register input | \`_d\` suffix | \`state_d\`, \`count_d\` |
| Register output | \`_q\` suffix | \`state_q\`, \`count_q\` |

## File Organization
- Extension: \`.sv\` for modules, \`.svh\` for headers
- One module per file, filename = module name
- Line length: 100 characters max
- Indentation: 2 spaces, no tabs

## Synthesizable Constructs
- Use \`logic\` for all signals
- Use \`always_comb\` for combinational logic
- Use \`always_ff\` for sequential logic
- Blocking (\`=\`) in \`always_comb\`, non-blocking (\`<=\`) in \`always_ff\`
- Explicit bit widths: \`8'd255\`, not \`255\`
- Use \`unique case\` or \`priority case\`

## Module Template

\`\`\`systemverilog
// Copyright notice
// SPDX-License-Identifier: Apache-2.0
//
// Module description

module module_name #(
  parameter int unsigned Width = 8,
  parameter int unsigned Depth = 16
) (
  input  logic             clk_i,
  input  logic             rst_ni,

  input  logic [Width-1:0] data_i,
  input  logic             valid_i,
  output logic             ready_o
);

  // Type definitions
  typedef enum logic [1:0] {
    StIdle,
    StProcess,
    StDone
  } state_e;

  // Signals
  state_e state_q, state_d;

  // Combinational logic
  always_comb begin
    state_d = state_q;
    unique case (state_q)
      StIdle:    if (valid_i) state_d = StProcess;
      StProcess: state_d = StDone;
      StDone:    state_d = StIdle;
      default:   state_d = StIdle;
    endcase
  end

  // Sequential logic (active-low async reset)
  always_ff @(posedge clk_i or negedge rst_ni) begin
    if (!rst_ni) begin
      state_q <= StIdle;
    end else begin
      state_q <= state_d;
    end
  end

  assign ready_o = (state_q == StIdle);

endmodule
\`\`\`

## Testbench Requirements (MANDATORY)

**Every module must have a corresponding testbench** named \`<module>_tb.sv\`.

\`\`\`systemverilog
module module_name_tb;
  // Parameters
  parameter int unsigned ClkPeriod = 10;

  // Signals
  logic clk, rst_n;
  logic [7:0] data;
  logic valid, ready;

  // Clock generation
  initial begin
    clk = 0;
    forever #(ClkPeriod/2) clk = ~clk;
  end

  // DUT
  module_name u_dut (
    .clk_i   (clk),
    .rst_ni  (rst_n),
    .data_i  (data),
    .valid_i (valid),
    .ready_o (ready)
  );

  // Stimulus
  initial begin
    rst_n = 0;
    data = '0;
    valid = 0;

    repeat(5) @(posedge clk);
    rst_n = 1;
    repeat(2) @(posedge clk);

    // Test cases here
    @(posedge clk);
    data = 8'hA5;
    valid = 1;
    @(posedge clk);
    valid = 0;

    repeat(10) @(posedge clk);
    $finish;
  end

  // Timeout
  initial begin
    #100000;
    $error("Timeout!");
    $finish;
  end
endmodule
\`\`\`

## Verilator Verification (MANDATORY)

All code must pass Verilator checks:

\`\`\`bash
# Lint check
verilator --lint-only -Wall -Wno-fatal module.sv

# Compile and simulate testbench
verilator --cc --exe --build -Wall --trace \\
  module_tb.sv module.sv --top-module module_tb
./obj_dir/Vmodule_tb
\`\`\`

## Common Verilator Warnings
- \`UNUSED\`: Remove or annotate unused signals
- \`UNDRIVEN\`: Ensure all outputs are driven
- \`WIDTH\`: Fix bit width mismatches
- \`CASEINCOMPLETE\`: Add \`default\` case
- \`LATCH\`: Fix incomplete \`always_comb\` assignments

## Checklist Before Completion
1. [ ] Naming conventions followed
2. [ ] Active-low async reset used
3. [ ] Explicit bit widths everywhere
4. [ ] \`always_comb\`/\`always_ff\` used correctly
5. [ ] Testbench exists with basic tests
6. [ ] \`verilator --lint-only -Wall\` passes
7. [ ] Testbench runs without errors`,
}

export function createBuiltinSkills(): BuiltinSkill[] {
  return [playwrightSkill, systemverilogSkill]
}
