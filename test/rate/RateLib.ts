import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { viem } from 'hardhat';
import { expect } from 'chai';

describe('RateLib', function () {
  async function deployFixture() {
    const rateLib = await viem.deployContract('RateLibTest');
    return { rateLib };
  }

  //
  // RateLib.calcRate
  //

  it('Should calc rate for equal input and output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1n;
    const output = 1n;
    const expectedRate = 1_000000000_000000000_000000000_000000000n; // 1.0

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc rate for input greater than output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 5n;
    const output = 4n;
    const expectedRate = 800000000_000000000_000000000_000000000n; // 0.8

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc rate for input less than output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 4n;
    const output = 5n;
    const expectedRate = 1_250000000_000000000_000000000_000000000n; // 1.25

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc rate for huge input greater than output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 333_222_681_494_555_123_841_157_212_873_451_652_317_831_239_041_736_123n; // 178 bit
    const output = 942_333_789_111_012_345_888_800_555_777_000_814_765_505_999n; // 150 bit
    const expectedRate = 2_827940117_654956598_787394054n; // 0.00000000282794...

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc rate for huge input less than output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 942_333_789_111_012_345_888_800_555_777_000_814_765_505_999n; // 150 bit
    const output = 333_222_681_494_555_123_841_157_212_873_451_652_317_831_239_041_736_123n; // 178 bit
    const expectedRate = 353614276_963276304_014279451_446318987_918664599n; // 353'614'276.9632763...

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc zero rate for zero output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1n;
    const output = 0n;
    const expectedRate = 0n; // 0.0

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc zero rate for zero input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 0n;
    const output = 1n;
    const expectedRate = 0n; // 0.0

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  it('Should calc zero rate for zero input and output', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 0n;
    const output = 0n;
    const expectedRate = 0n; // 0.0

    const rate = await rateLib.read.calcRate([input, output]);
    expect(rate).equal(expectedRate);
  });

  //
  // RateLib.applyRate
  //

  it('Should apply zero rate to zero input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 0n;
    const rate = 0n; // 0.0
    const expectedOutput = 0n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply zero rate to input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1n;
    const rate = 0n; // 0.0
    const expectedOutput = 0n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply one rate to zero input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 0n;
    const rate = 1_000000000_000000000_000000000_000000000n; // 1.0
    const expectedOutput = 0n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply one rate to input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1n;
    const rate = 1_000000000_000000000_000000000_000000000n; // 1.0
    const expectedOutput = 1n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply less-one rate to input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1000n;
    const rate = 888888888_000000000_000000000_000000000n; // 0.888888888
    const expectedOutput = 888n; // Rounded down

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply less-one rate to huge input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 333_222_681_494_555_123_841_157_212_873_451_652_317_831_239_041_736_123n; // 178 bit
    const rate = 888888888_000000000_000000000_000000000n; // 0.888...
    const expectedOutput = 296_197_938_810_073_282_085_868_523_584_261_723_950_559_632_643_471_007n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply greater-one rate to input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 1000n;
    const rate = 2_694232211_378200000_000000000_000000000n; // 2.6942322113782
    const expectedOutput = 2694n; // Rounded down

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply greater-one rate to huge input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 333_222_681_494_555_123_841_157_212_873_451_652_317_831_239_041_736_123n; // 178 bit
    const rate = 2_694232211_378200000_000000000_000000000n; // 2.6942322113782
    const expectedOutput = 897_779_282_044_448_853_909_180_558_275_362_966_334_613_148_794_890_010n;

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });

  it('Should apply huge rate to huge input', async function () {
    const { rateLib } = await loadFixture(deployFixture);

    const input = 333_222_681_494_555_123_841_157_212_873_451_652_317_831_239_041_736_123n; // 178 bit
    const rate = 505_777_814_765_505_999_942_333_789_111_012_345_888_800_555_120_398_476_114n; // 189 bit
    const expectedOutput = 168_536_639_676_618_305_439_835_003_564_556_949_195_417_068_861_362_688_570_225_222_991_215_790_055n; // 247 bit

    const output = await rateLib.read.applyRate([input, rate]);
    expect(output).equal(expectedOutput);
  });
});
