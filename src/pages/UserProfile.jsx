import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

function UserProfile() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = personal info, 2 = college student check, 3 = school/group selection
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isCollegeStudent, setIsCollegeStudent] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);

  useEffect(() => {
    // Check if there's an existing profile in localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      // If they have a saved profile with school, check if they want to change school
      if (profile.schoolName && !window.location.search.includes('changeSchool=true')) {
        navigate(`/school/${encodeURIComponent(profile.schoolName)}`);
        return;
      }
      // If profile exists but no school, or they want to change school, pre-fill the personal data and go to step 2
      setPersonalData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
      });
      setIsCollegeStudent(profile.isCollegeStudent);
      setStep(2);
    }
  }, [navigate]);

  function handlePersonalDataChange(e) {
    const { name, value } = e.target;
    setPersonalData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleSchoolNameChange(e) {
    setSchoolName(e.target.value);
  }

  function handleGroupNameChange(e) {
    setGroupName(e.target.value);
  }

  function handleCollegeStudentChange(value) {
    setIsCollegeStudent(value);
  }


  // Sample universities from the CSV data (first 100 entries)
  const sampleUniversities = [
    { name: 'Alabama A & M University', city: 'Normal', state: 'AL', website: 'www.aamu.edu' },
    { name: 'University of Alabama at Birmingham', city: 'Birmingham', state: 'AL', website: 'www.uab.edu' },
    { name: 'Amridge University', city: 'Montgomery', state: 'AL', website: 'www.amridgeuniversity.edu' },
    { name: 'University of Alabama in Huntsville', city: 'Huntsville', state: 'AL', website: 'www.uah.edu' },
    { name: 'Alabama State University', city: 'Montgomery', state: 'AL', website: 'www.alasu.edu' },
    { name: 'The University of Alabama', city: 'Tuscaloosa', state: 'AL', website: 'www.ua.edu' },
    { name: 'Central Alabama Community College', city: 'Alexander City', state: 'AL', website: 'www.cacc.edu' },
    { name: 'Auburn University at Montgomery', city: 'Montgomery', state: 'AL', website: 'www.aum.edu' },
    { name: 'Auburn University', city: 'Auburn', state: 'AL', website: 'www.auburn.edu' },
    { name: 'Birmingham Southern College', city: 'Birmingham', state: 'AL', website: 'www.bsc.edu' },
    { name: 'Chattahoochee Valley Community College', city: 'Phenix City', state: 'AL', website: 'www.cv.edu' },
    { name: 'Concordia College Alabama', city: 'Selma', state: 'AL', website: 'www.concordiaselma.edu' },
    { name: 'South University-Montgomery', city: 'Montgomery', state: 'AL', website: 'www.southuniversity.edu' },
    { name: 'Enterprise State Community College', city: 'Enterprise', state: 'AL', website: 'www.escc.edu' },
    { name: 'James H Faulkner State Community College', city: 'Bay Minette', state: 'AL', website: 'www.faulknerstate.edu' },
    { name: 'Faulkner University', city: 'Montgomery', state: 'AL', website: 'www.faulkner.edu' },
    { name: 'Gadsden State Community College', city: 'Gadsden', state: 'AL', website: 'www.gadsdenstate.edu' },
    { name: 'New Beginning College of Cosmetology', city: 'Albertville', state: 'AL', website: 'www.newbeginningcollege.com' },
    { name: 'George C Wallace State Community College-Dothan', city: 'Dothan', state: 'AL', website: 'www.wallacestate.edu' },
    { name: 'George C Wallace State Community College-Hanceville', city: 'Hanceville', state: 'AL', website: 'www.wallacestate.edu' },
    { name: 'George C Wallace State Community College-Selma', city: 'Selma', state: 'AL', website: 'www.wallacestate.edu' },
    { name: 'Herzing University-Birmingham', city: 'Birmingham', state: 'AL', website: 'www.herzing.edu' },
    { name: 'Huntingdon College', city: 'Montgomery', state: 'AL', website: 'www.huntingdon.edu' },
    { name: 'Heritage Christian University', city: 'Florence', state: 'AL', website: 'www.hcu.edu' },
    { name: 'J F Drake State Community and Technical College', city: 'Huntsville', state: 'AL', website: 'www.drakestate.edu' },
    { name: 'J F Ingram State Technical College', city: 'Deatsville', state: 'AL', website: 'www.ingramstate.edu' },
    { name: 'Jacksonville State University', city: 'Jacksonville', state: 'AL', website: 'www.jsu.edu' },
    { name: 'Jefferson Davis Community College', city: 'Brewton', state: 'AL', website: 'www.jdcc.edu' },
    { name: 'Jefferson State Community College', city: 'Birmingham', state: 'AL', website: 'www.jeffstateonline.com' },
    { name: 'John C Calhoun State Community College', city: 'Tanner', state: 'AL', website: 'www.calhoun.edu' },
    { name: 'Judson College', city: 'Marion', state: 'AL', website: 'www.judson.edu' },
    { name: 'Lawson State Community College-Birmingham Campus', city: 'Birmingham', state: 'AL', website: 'www.lawsonstate.edu' },
    { name: 'University of West Alabama', city: 'Livingston', state: 'AL', website: 'www.uwa.edu' },
    { name: 'Lurleen B Wallace Community College', city: 'Andalusia', state: 'AL', website: 'www.lbwcc.edu' },
    { name: 'Marion Military Institute', city: 'Marion', state: 'AL', website: 'www.marionmilitary.edu' },
    { name: 'Miles College', city: 'Fairfield', state: 'AL', website: 'www.miles.edu' },
    { name: 'University of Mobile', city: 'Mobile', state: 'AL', website: 'www.umobile.edu' },
    { name: 'University of Montevallo', city: 'Montevallo', state: 'AL', website: 'www.montevallo.edu' },
    { name: 'Northwest-Shoals Community College', city: 'Muscle Shoals', state: 'AL', website: 'www.nwscc.edu' },
    { name: 'University of North Alabama', city: 'Florence', state: 'AL', website: 'www.una.edu' },
    { name: 'Northeast Alabama Community College', city: 'Rainsville', state: 'AL', website: 'www.nacc.edu' },
    { name: 'Oakwood University', city: 'Huntsville', state: 'AL', website: 'www.oakwood.edu' },
    { name: 'Alabama Southern Community College', city: 'Monroeville', state: 'AL', website: 'www.ascc.edu' },
    { name: 'Prince Institute-Southeast', city: 'Montgomery', state: 'AL', website: 'www.princeinstitute.edu' },
    { name: 'Reid State Technical College', city: 'Evergreen', state: 'AL', website: 'www.rstc.edu' },
    { name: 'Bishop State Community College', city: 'Mobile', state: 'AL', website: 'www.bishopstate.edu' },
    { name: 'Samford University', city: 'Birmingham', state: 'AL', website: 'www.samford.edu' },
    { name: 'Shelton State Community College', city: 'Tuscaloosa', state: 'AL', website: 'www.sheltonstate.edu' },
    { name: 'Snead State Community College', city: 'Boaz', state: 'AL', website: 'www.snead.edu' },
    { name: 'University of South Alabama', city: 'Mobile', state: 'AL', website: 'www.southalabama.edu' },
    { name: 'Southeastern Bible College', city: 'Birmingham', state: 'AL', website: 'www.sebc.edu' },
    { name: 'Spring Hill College', city: 'Mobile', state: 'AL', website: 'www.shc.edu' },
    { name: 'Bevill State Community College', city: 'Jasper', state: 'AL', website: 'www.bscc.edu' },
    { name: 'Stillman College', city: 'Tuscaloosa', state: 'AL', website: 'www.stillman.edu' },
    { name: 'Talladega College', city: 'Talladega', state: 'AL', website: 'www.talladega.edu' },
    { name: 'Trenholm State Community College', city: 'Montgomery', state: 'AL', website: 'www.trenholmstate.edu' },
    { name: 'Troy University', city: 'Troy', state: 'AL', website: 'www.troy.edu' },
    { name: 'Tuskegee University', city: 'Tuskegee', state: 'AL', website: 'www.tuskegee.edu' },
    { name: 'United States Sports Academy', city: 'Daphne', state: 'AL', website: 'www.ussa.edu' },
    { name: 'Bevill State Community College', city: 'Sumiton', state: 'AL', website: 'www.bscc.edu' },
    { name: 'University of Alaska Anchorage', city: 'Anchorage', state: 'AK', website: 'www.uaa.alaska.edu' },
    { name: 'Alaska Pacific University', city: 'Anchorage', state: 'AK', website: 'www.alaskapacific.edu' },
    { name: 'University of Alaska Fairbanks', city: 'Fairbanks', state: 'AK', website: 'www.uaf.edu' },
    { name: 'University of Alaska Southeast', city: 'Juneau', state: 'AK', website: 'www.uas.alaska.edu' },
    { name: 'Alaska Bible College', city: 'Palmer', state: 'AK', website: 'www.akbible.edu' },
    { name: 'Alaska Career College', city: 'Anchorage', state: 'AK', website: 'www.alaskacareercollege.edu' },
    { name: 'Alaska Christian College', city: 'Soldotna', state: 'AK', website: 'www.akchristiancollege.edu' },
    { name: 'Alaska Pacific University', city: 'Anchorage', state: 'AK', website: 'www.alaskapacific.edu' },
    { name: 'Charter College-Anchorage', city: 'Anchorage', state: 'AK', website: 'www.chartercollege.edu' },
    { name: 'Ilisagvik College', city: 'Barrow', state: 'AK', website: 'www.ilisagvik.edu' },
    { name: 'Alaska Vocational Technical Center', city: 'Seward', state: 'AK', website: 'www.avtec.edu' },
    { name: 'University of Alaska Anchorage', city: 'Anchorage', state: 'AK', website: 'www.uaa.alaska.edu' },
    { name: 'University of Alaska Fairbanks', city: 'Fairbanks', state: 'AK', website: 'www.uaf.edu' },
    { name: 'University of Alaska Southeast', city: 'Juneau', state: 'AK', website: 'www.uas.alaska.edu' },
    { name: 'Arizona State University-Downtown Phoenix', city: 'Phoenix', state: 'AZ', website: 'www.asu.edu' },
    { name: 'Arizona State University-Polytechnic', city: 'Mesa', state: 'AZ', website: 'www.asu.edu' },
    { name: 'Arizona State University-Tempe', city: 'Tempe', state: 'AZ', website: 'www.asu.edu' },
    { name: 'Arizona State University-West', city: 'Glendale', state: 'AZ', website: 'www.asu.edu' },
    { name: 'University of Arizona', city: 'Tucson', state: 'AZ', website: 'www.arizona.edu' },
    { name: 'Central Arizona College', city: 'Coolidge', state: 'AZ', website: 'www.centralaz.edu' },
    { name: 'Chandler-Gilbert Community College', city: 'Chandler', state: 'AZ', website: 'www.cgc.edu' },
    { name: 'Cochise County Community College District', city: 'Douglas', state: 'AZ', website: 'www.cochise.edu' },
    { name: 'Coconino Community College', city: 'Flagstaff', state: 'AZ', website: 'www.coconino.edu' },
    { name: 'Dine College', city: 'Tsaile', state: 'AZ', website: 'www.dinecollege.edu' },
    { name: 'Eastern Arizona College', city: 'Thatcher', state: 'AZ', website: 'www.eac.edu' },
    { name: 'Glendale Community College', city: 'Glendale', state: 'AZ', website: 'www.gccaz.edu' },
    { name: 'Grand Canyon University', city: 'Phoenix', state: 'AZ', website: 'www.gcu.edu' },
    { name: 'Mesa Community College', city: 'Mesa', state: 'AZ', website: 'www.mesacc.edu' },
    { name: 'Mohave Community College', city: 'Kingman', state: 'AZ', website: 'www.mohave.edu' },
    { name: 'Northland Pioneer College', city: 'Holbrook', state: 'AZ', website: 'www.npc.edu' },
    { name: 'Northern Arizona University', city: 'Flagstaff', state: 'AZ', website: 'www.nau.edu' },
    { name: 'Phoenix College', city: 'Phoenix', state: 'AZ', website: 'www.phoenixcollege.edu' },
    { name: 'Pima Community College', city: 'Tucson', state: 'AZ', website: 'www.pima.edu' },
    { name: 'Prescott College', city: 'Prescott', state: 'AZ', website: 'www.prescott.edu' },
    { name: 'Rio Salado College', city: 'Tempe', state: 'AZ', website: 'www.riosalado.edu' },
    { name: 'Scottsdale Community College', city: 'Scottsdale', state: 'AZ', website: 'www.scottsdalecc.edu' },
    { name: 'South Mountain Community College', city: 'Phoenix', state: 'AZ', website: 'www.southmountaincc.edu' },
    { name: 'University of Advancing Technology', city: 'Tempe', state: 'AZ', website: 'www.uat.edu' },
    { name: 'Western International University', city: 'Tempe', state: 'AZ', website: 'www.wintu.edu' },
    { name: 'Yavapai College', city: 'Prescott', state: 'AZ', website: 'www.yc.edu' },
    { name: 'University of Arkansas at Little Rock', city: 'Little Rock', state: 'AR', website: 'www.ualr.edu' },
    { name: 'University of Arkansas for Medical Sciences', city: 'Little Rock', state: 'AR', website: 'www.uams.edu' },
    { name: 'University of Arkansas', city: 'Fayetteville', state: 'AR', website: 'www.uark.edu' },
    { name: 'Arkansas Baptist College', city: 'Little Rock', state: 'AR', website: 'www.arkansasbaptist.edu' },
    { name: 'Arkansas State University-Beebe', city: 'Beebe', state: 'AR', website: 'www.asub.edu' },
    { name: 'Arkansas State University-Main Campus', city: 'Jonesboro', state: 'AR', website: 'www.astate.edu' },
    { name: 'Arkansas State University-Newport', city: 'Newport', state: 'AR', website: 'www.asun.edu' },
    { name: 'Arkansas Tech University', city: 'Russellville', state: 'AR', website: 'www.atu.edu' },
    { name: 'University of Arkansas at Monticello', city: 'Monticello', state: 'AR', website: 'www.uamont.edu' },
    { name: 'Black River Technical College', city: 'Pocahontas', state: 'AR', website: 'www.blackrivertech.edu' },
    { name: 'University of Central Arkansas', city: 'Conway', state: 'AR', website: 'www.uca.edu' },
    { name: 'Central Baptist College', city: 'Conway', state: 'AR', website: 'www.cbc.edu' },
    { name: 'Cossatot Community College of the University of Arkansas', city: 'De Queen', state: 'AR', website: 'www.cccua.edu' },
    { name: 'Crowleys Ridge College', city: 'Paragould', state: 'AR', website: 'www.crc.edu' },
    { name: 'East Arkansas Community College', city: 'Forrest City', state: 'AR', website: 'www.eacc.edu' },
    { name: 'Ecclesia College', city: 'Springdale', state: 'AR', website: 'www.ecclesia.edu' },
    { name: 'Harding University', city: 'Searcy', state: 'AR', website: 'www.harding.edu' },
    { name: 'Henderson State University', city: 'Arkadelphia', state: 'AR', website: 'www.hsu.edu' },
    { name: 'Hendrix College', city: 'Conway', state: 'AR', website: 'www.hendrix.edu' },
    { name: 'John Brown University', city: 'Siloam Springs', state: 'AR', website: 'www.jbu.edu' },
    { name: 'Lyon College', city: 'Batesville', state: 'AR', website: 'www.lyon.edu' },
    { name: 'University of the Ozarks', city: 'Clarksville', state: 'AR', website: 'www.ozarks.edu' },
    { name: 'Philander Smith College', city: 'Little Rock', state: 'AR', website: 'www.philander.edu' },
    { name: 'Phillips Community College of the University of Arkansas', city: 'Helena', state: 'AR', website: 'www.pccua.edu' },
    { name: 'Southeast Arkansas College', city: 'Pine Bluff', state: 'AR', website: 'www.seark.edu' },
    { name: 'Southern Arkansas University Main Campus', city: 'Magnolia', state: 'AR', website: 'www.saumag.edu' },
    { name: 'University of Arkansas Community College-Batesville', city: 'Batesville', state: 'AR', website: 'www.uaccb.edu' },
    { name: 'University of Arkansas Community College-Hope', city: 'Hope', state: 'AR', website: 'www.uacch.edu' },
    { name: 'University of Arkansas Community College-Morrilton', city: 'Morrilton', state: 'AR', website: 'www.uaccm.edu' },
    { name: 'Williams Baptist College', city: 'Walnut Ridge', state: 'AR', website: 'www.wbcoll.edu' },
    { name: 'Suffolk University', city: 'Boston', state: 'MA', website: 'www.suffolk.edu' },
    { name: 'University of Connecticut', city: 'Storrs', state: 'CT', website: 'uconn.edu' },
    { name: 'University of Miami', city: 'Coral Gables', state: 'FL', website: 'miami.edu' },
    { name: 'University of Wisconsin-Madison', city: 'Madison', state: 'WI', website: 'wisc.edu' },
    { name: 'Harvard University', city: 'Cambridge', state: 'MA', website: 'harvard.edu' },
    { name: 'Stanford University', city: 'Stanford', state: 'CA', website: 'stanford.edu' },
    { name: 'University of California-Berkeley', city: 'Berkeley', state: 'CA', website: 'berkeley.edu' },
    { name: 'Massachusetts Institute of Technology', city: 'Cambridge', state: 'MA', website: 'mit.edu' },
    { name: 'Yale University', city: 'New Haven', state: 'CT', website: 'yale.edu' },
    { name: 'Princeton University', city: 'Princeton', state: 'NJ', website: 'princeton.edu' }
  ];

  async function validateSchoolName(schoolName) {
    console.log('🔍 Validating school:', schoolName);
    
    try {
      console.log('🔥 Calling Cloud Function to validate university...');
      
      // Call the Cloud Function using Admin SDK
      const validateUniversity = httpsCallable(functions, 'validateUniversity');
      const result = await validateUniversity({ schoolName: schoolName.trim() });
      
      console.log('🎯 Cloud Function result:', result.data);
      
      if (result.data.isValid) {
        console.log('✅ University found:', result.data.school);
        return {
          isValid: true,
          school: result.data.school,
          matchType: result.data.matchType
        };
      } else {
        console.log('❌ University not found:', result.data.message);
        return {
          isValid: false,
          message: result.data.message
        };
      }
      
    } catch (error) {
      console.error('💥 Cloud Function validation failed:', error);
      
      // Fallback to sample list if Cloud Function fails
      console.log('🔄 Falling back to sample universities list...');
      const searchTermLower = schoolName.toLowerCase();
      
      for (const uni of sampleUniversities) {
        if (uni.name.toLowerCase() === searchTermLower || uni.name.toLowerCase().includes(searchTermLower)) {
          console.log('✅ Found match in sample universities:', uni);
          return { 
            isValid: true, 
            school: uni,
            matchType: 'sample'
          };
        }
      }
      
      console.log('❌ No matches found anywhere');
      return { 
        isValid: false, 
        message: `School "${schoolName}" not found in our database. Please check the spelling or try a different name.` 
      };
    }
  }

  async function handlePersonalDataSubmit(e) {
    e.preventDefault();
    
    if (!personalData.firstName.trim() || !personalData.lastName.trim() || !personalData.email.trim()) {
      alert('Please fill in all required fields (First Name, Last Name, and Email)');
      return;
    }

    setSaving(true);

    try {
      // Check if profile already exists
      const profilesQuery = query(
        collection(db, 'userProfiles'),
        where('email', '==', personalData.email)
      );
      const profilesSnapshot = await getDocs(profilesQuery);

      const profileData = {
        firstName: personalData.firstName.trim(),
        lastName: personalData.lastName.trim(),
        name: `${personalData.firstName.trim()} ${personalData.lastName.trim().charAt(0).toUpperCase()}.`, // Display name format
        email: personalData.email.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!profilesSnapshot.empty) {
        // Update existing profile
        const profileDoc = profilesSnapshot.docs[0];
        await updateDoc(doc(db, 'userProfiles', profileDoc.id), {
          ...profileData,
          updatedAt: new Date().toISOString()
        });
        setExistingProfile({ id: profileDoc.id, ...profileData });
      } else {
        // Create new profile
        const docRef = await addDoc(collection(db, 'userProfiles'), profileData);
        setExistingProfile({ id: docRef.id, ...profileData });
      }

      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      alert('Profile saved successfully!');
      setStep(2); // Move to school selection step
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    }

    setSaving(false);
  }

  async function handleSchoolSelection(e) {
    e.preventDefault();
    
    if (isCollegeStudent && !schoolName.trim()) {
      alert('Please enter your school name');
      return;
    }
    
    if (!isCollegeStudent && !groupName.trim()) {
      alert('Please enter your group name');
      return;
    }

    setSaving(true);

    try {
      if (isCollegeStudent) {
        // Validate school name for college students
        console.log('🚀 Starting validation for:', schoolName.trim());
        const schoolValidation = await validateSchoolName(schoolName.trim());
        console.log('🎯 Validation result:', schoolValidation);
        
        if (!schoolValidation.isValid) {
          console.log('❌ Validation failed:', schoolValidation.message);
          alert(schoolValidation.message);
          setSaving(false);
          return;
        }
        
        console.log('✅ Validation passed, saving school and navigating to school page...');
        
        // Save school to user profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          profile.schoolName = schoolValidation.school.name;
          profile.isCollegeStudent = true;
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }
        
        // Navigate to school page
        navigate(`/school/${encodeURIComponent(schoolValidation.school.name)}`);
      } else {
        // Handle group creation for non-students
        console.log('🚀 Creating group for non-student:', groupName.trim());
        
        // Check if group already exists by looking for competitions
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        const existingGroupsQuery = query(
          collection(db, 'competitions'),
          where('groupName', '==', groupName.trim())
        );
        const existingGroupsSnapshot = await getDocs(existingGroupsQuery);
        const groupExists = !existingGroupsSnapshot.empty;
        
        // Save group to user profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          profile.groupName = groupName.trim();
          profile.isCollegeStudent = false;
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }
        
        // Show appropriate message based on whether group exists
        if (groupExists) {
          alert(`Welcome to "${groupName.trim()}"! You can now participate in competitions.`);
        } else {
          alert(`Group "${groupName.trim()}" created! You can now participate in competitions.`);
        }
        
        navigate(`/group/${encodeURIComponent(groupName.trim())}`);
      }
      
    } catch (err) {
      console.error('Error processing selection:', err);
      alert('Failed to process your selection. Please try again.');
    }

    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-blue-shiny-gradient flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/')}
              className="text-yellow-700 hover:text-yellow-800 font-medium flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <div className="flex-1"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Create Your Profile' : step === 2 ? 'Are You a College Student?' : 'Complete Your Setup'}
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? 'Set up your profile to join competitions' 
              : step === 2
              ? 'This helps us show you the right competitions'
              : isCollegeStudent
              ? 'Select your university to access school competitions'
              : 'Create a group name to access group competitions'
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePersonalDataSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={personalData.firstName}
                onChange={handlePersonalDataChange}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={personalData.lastName}
                onChange={handlePersonalDataChange}
                placeholder="Enter your last name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={personalData.email}
                onChange={handlePersonalDataChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        ) : step === 2 ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => handleCollegeStudentChange(true)}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                    isCollegeStudent === true 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Yes, I'm a college student
                </button>
                <button
                  type="button"
                  onClick={() => handleCollegeStudentChange(false)}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                    isCollegeStudent === false 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No, I'm not a student
                </button>
              </div>
            </div>
            
            {isCollegeStudent !== null && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold transition-all duration-300"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSchoolSelection} className="space-y-6">
            {isCollegeStudent ? (
              /* School Name for College Students */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
              <input
                type="text"
                value={schoolName}
                onChange={handleSchoolNameChange}
                placeholder="e.g., Harvard University, Stanford University, Massachusetts Institute of Technology"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                required
              />
                <p className="text-sm text-gray-500 mt-1">
                  <strong>Please be specific:</strong> Enter the full, official name of your university (e.g., "University of California, Berkeley" not just "UC Berkeley"). We'll validate it against our database of accredited institutions.
                </p>
              </div>
            ) : (
              /* Group Name for Non-Students */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={handleGroupNameChange}
                  placeholder="e.g., Fetch LLC"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Create a group name for your organization or team
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gold text-white py-3 rounded-lg font-semibold hover:bg-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {saving ? 'Validating...' : isCollegeStudent ? 'Continue to School' : 'Continue to Group'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300"
            >
              ← Back to Profile
            </button>
          </form>
        )}

        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-blue-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> {step === 1 
              ? 'Your profile information will be saved and used to identify you in competitions.' 
              : step === 2
              ? 'This helps us show you the right competitions for your situation.'
              : isCollegeStudent
              ? 'School selection is not saved - you can choose a different school anytime.'
              : 'Group name will be used to identify your organization in competitions.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
