describe('Test Heatmap with jasmine ', function() {

  beforeEach( function() {
	initHeatMap([],[],[],[]);
  });

  afterEach(function() {
	  //remove elements after testing
    d3.selectAll('svg').remove();
    d3.selectAll('#tooltipHeatmap').remove();	
  });

  describe('Heatmap' ,function() {
    it('should be created', function() {
        expect(getSvg()).not.toBeNull();
    });

    it('should have the correct height', function() {
      expect(getSvg().attr('width')).toBe("600");
    });

    it('should have the correct width', function() {
      expect(getSvg().attr('height')).toBe("500");
    });
  });
  
  describe('Tooltip' ,function() {
    it('should be created', function() {
        expect(getTooltip()).not.toBeNull();
    });
  });
  
  describe('Data load' ,function() { 
	it('should fetch data from CSV', function(done){	 
		expect(d3.csv).toBeDefined();
		d3.csv("./flights_2015_sample.csv")
		.get((data)=> { 
			done();		
			expect(data.length).not.toBeNull();   
		});
	});
  });

  function getSvg() {
    return d3.select('svg');
  }
  
  function getTooltip(){
	return d3.select('#tooltip');
  }
});