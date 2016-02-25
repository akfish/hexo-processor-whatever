Name = require('../src/name')

describe "Name", ->
  it "should transform names correctly", ->
    fooName = new Name("FoO")
    expect(fooName).to.have.property('normalized', "foO")
    expect(fooName).to.have.property('titled'    , "FoO")
    expect(fooName).to.have.property('plural'    , "foOs")
    expect(fooName).to.have.property('dirPath'   , "_foOs/")
